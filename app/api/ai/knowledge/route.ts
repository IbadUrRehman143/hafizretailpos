import { NextResponse } from "next/server";
import { requireApiPermission } from "@/src/lib/auth/apiGuard";
import { addKnowledge, listKnowledge, searchKnowledge, type ActorScope } from "@/src/lib/autonomous-intelligence";

export const dynamic = "force-dynamic";
const actorFrom = (s: any): ActorScope => ({ id:s.id, name:s.name, role:s.role, branchId:s.branchId });

export async function GET(request: Request) {
  const auth = await requireApiPermission("reports", "view"); if (!auth.ok) return auth.response;
  const q = (new URL(request.url).searchParams.get("q") || "").trim();
  const actor = actorFrom(auth.session);
  const data = q ? await searchKnowledge(q, actor) : await listKnowledge(actor);
  return NextResponse.json({ success:true, verified:true, data });
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiPermission("reports", "create"); if (!auth.ok) return auth.response;
    const body = await request.json();
    const data = await addKnowledge({ title:String(body.title||""), sourceType:body.sourceType||"NOTE", content:String(body.content||"") }, actorFrom(auth.session));
    return NextResponse.json({ success:true, verified:true, data });
  } catch(e) {
    return NextResponse.json({ success:false, message:e instanceof Error?e.message:"Unable to save knowledge." },{status:400});
  }
}
