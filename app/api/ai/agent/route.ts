import { NextResponse } from "next/server";
import { requireApiPermission } from "@/src/lib/auth/apiGuard";
import { buildPurchasePlan, proposeFollowUp, type ActorScope } from "@/src/lib/autonomous-intelligence";
const actorFrom = (s:any):ActorScope => ({id:s.id,name:s.name,role:s.role,branchId:s.branchId});

export async function POST(request: Request) {
  try {
    const auth = await requireApiPermission("purchases", "create"); if (!auth.ok) return auth.response;
    const body = await request.json(); const workflow = String(body.workflow || "PURCHASE_PLAN");
    const data = workflow === "PURCHASE_PLAN"
      ? await buildPurchasePlan(Number(body.targetStockDays || 30), actorFrom(auth.session), Number(body.supplierId || 0))
      : await proposeFollowUp({title:String(body.title||""),reason:String(body.reason||""),payload:body.payload||{}}, actorFrom(auth.session));
    return NextResponse.json({success:true,verified:true,requiresApproval:true,data});
  } catch(e) { return NextResponse.json({success:false,message:e instanceof Error?e.message:"Unable to run business agent."},{status:400}); }
}
