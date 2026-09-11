import "server-only";
import { createHash } from "node:crypto";
import { db } from "@/src/prisma/db";
import { cosineSimilarity, embedText } from "./embeddings";
import type { ActorScope, KnowledgeMatch, KnowledgeSourceType } from "./types";

function normalize(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
function tokenSet(value: string) {
  return new Set(normalize(value).split(/\s+/).filter(Boolean));
}
function lexicalScore(query: string, text: string) {
  const q = tokenSet(query); const t = tokenSet(text);
  if (!q.size) return 0;
  let hits = 0; q.forEach((word) => { if (t.has(word)) hits += 1; });
  return hits / q.size;
}
function chunkText(content: string, size = 900, overlap = 120) {
  const clean = content.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  for (let start = 0; start < clean.length;) {
    const end = Math.min(clean.length, start + size);
    chunks.push(clean.slice(start, end));
    if (end === clean.length) break;
    start = Math.max(start + 1, end - overlap);
  }
  return chunks;
}
function sourceType(value: unknown): KnowledgeSourceType {
  const v = String(value || "NOTE").toUpperCase();
  return (["POLICY","SUPPLIER","PRODUCT","NOTE"] as const).includes(v as KnowledgeSourceType)
    ? v as KnowledgeSourceType : "NOTE";
}

export async function addKnowledge(input: { title: string; sourceType: KnowledgeSourceType; content: string }, actor: ActorScope) {
  const title = input.title.trim(); const content = input.content.trim();
  if (!title || !content) throw new Error("Title and content are required.");
  if (title.length > 160) throw new Error("Title is too long.");
  if (content.length > 50000) throw new Error("Content is too large.");
  const chunks = chunkText(content);
  return db.transaction(async (tx) => {
    const source = await tx.orm.public.AiKnowledgeSource.create({
      title, sourceType: sourceType(input.sourceType), content,
      contentHash: createHash("sha256").update(content).digest("hex"),
      branchId: actor.branchId, createdById: actor.id, createdByName: actor.name,
    });
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await embedText(chunks[i]);
      await tx.orm.public.AiKnowledgeChunk.create({
        sourceId: source.id, chunkIndex: i, content: chunks[i],
        embeddingJson: embedding ? JSON.stringify(embedding) : "",
      });
    }
    await tx.orm.public.AuditLog.create({
      module: "AI Knowledge", action: "Create", description: `Knowledge source added: ${title}`,
      status: "Success", ipAddress: "", userId: actor.id, userName: actor.name, userRole: actor.role,
    });
    return { id: source.id, title, sourceType: input.sourceType, chunks: chunks.length, semanticReady: Boolean(process.env.OPENAI_API_KEY) };
  });
}

export async function listKnowledge(actor: ActorScope) {
  const all = await db.orm.public.AiKnowledgeSource.all();
  return all.filter((row) => actor.branchId === null || row.branchId === actor.branchId).map((row) => ({
    id: row.id, title: row.title, sourceType: sourceType(row.sourceType), characters: String(row.content || "").length,
    createdAt: row.createdAt,
  })).sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function searchKnowledge(query: string, actor: ActorScope, limit = 5): Promise<KnowledgeMatch[]> {
  const clean = query.trim(); if (!clean) return [];
  const [sources, chunks, queryEmbedding] = await Promise.all([
    db.orm.public.AiKnowledgeSource.all(), db.orm.public.AiKnowledgeChunk.all(), embedText(clean),
  ]);
  const sourceMap = new Map(sources.filter((s) => actor.branchId === null || s.branchId === actor.branchId).map((s) => [Number(s.id), s]));
  const matches: KnowledgeMatch[] = [];
  for (const chunk of chunks) {
    const source = sourceMap.get(Number(chunk.sourceId)); if (!source) continue;
    let score = 0; let retrievalMode: KnowledgeMatch["retrievalMode"] = "lexical-fallback";
    if (queryEmbedding && chunk.embeddingJson) {
      try {
        const embedding = JSON.parse(String(chunk.embeddingJson)) as number[];
        score = cosineSimilarity(queryEmbedding, embedding); retrievalMode = "semantic";
      } catch { score = lexicalScore(clean, `${source.title} ${chunk.content}`); }
    } else score = lexicalScore(clean, `${source.title} ${chunk.content}`);
    if (score > 0) matches.push({ sourceId: Number(source.id), title: String(source.title), sourceType: sourceType(source.sourceType), excerpt: String(chunk.content).slice(0,600), score: Number(score.toFixed(4)), retrievalMode });
  }
  return matches.sort((a,b) => b.score-a.score).slice(0, Math.max(1,Math.min(limit,10)));
}


export async function deleteKnowledge(sourceId: number, actor: ActorScope) {
  if (!Number.isInteger(sourceId) || sourceId <= 0) {
    throw new Error("Valid knowledge source ID is required.");
  }

  return db.transaction(async (tx) => {
    const source = await tx.orm.public.AiKnowledgeSource
      .where({ id: sourceId })
      .first();

    if (
      !source ||
      (actor.branchId !== null && source.branchId !== actor.branchId)
    ) {
      throw new Error("Knowledge source not found.");
    }

    const chunks = await tx.orm.public.AiKnowledgeChunk
      .where({ sourceId })
      .all();

    for (const chunk of chunks) {
      await tx.orm.public.AiKnowledgeChunk
        .where({ id: chunk.id })
        .delete();
    }

    await tx.orm.public.AiKnowledgeSource
      .where({ id: sourceId })
      .delete();

    await tx.orm.public.AuditLog.create({
      module: "AI Knowledge",
      action: "Delete",
      description: `Knowledge source deleted: ${source.title}`,
      status: "Success",
      ipAddress: "",
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
    });

    return {
      id: sourceId,
      title: source.title,
    };
  });
}
