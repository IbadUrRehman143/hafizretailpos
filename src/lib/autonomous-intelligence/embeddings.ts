import "server-only";
import OpenAI from "openai";

const model = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

export async function embedText(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !text.trim()) return null;
  try {
    const client = new OpenAI({ apiKey });
    const result = await client.embeddings.create({ model, input: text.slice(0, 8000) });
    return result.data[0]?.embedding ?? null;
  } catch (error) {
    console.warn("Embedding unavailable; using explicit lexical fallback.", error);
    return null;
  }
}

export function cosineSimilarity(a: number[], b: number[]) {
  if (!a.length || a.length !== b.length) return 0;
  let dot = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    aa += a[i] * a[i];
    bb += b[i] * b[i];
  }
  return aa && bb ? dot / (Math.sqrt(aa) * Math.sqrt(bb)) : 0;
}
