import { NextResponse } from "next/server";
import { requireApiPermission } from "@/src/lib/auth/apiGuard";
import { decideAction, executeApprovedAction, listActions, type ActorScope } from "@/src/lib/autonomous-intelligence";
const actorFrom=(s:any):ActorScope=>({id:s.id,name:s.name,role:s.role,branchId:s.branchId});

export async function GET() {
  const auth=await requireApiPermission("purchases","view"); if(!auth.ok)return auth.response;
  return NextResponse.json({success:true,verified:true,data:await listActions(actorFrom(auth.session))});
}
export async function POST(request:Request) {
  try {
    const auth=await requireApiPermission("purchases","edit"); if(!auth.ok)return auth.response;
    const body=await request.json(); const action=String(body.action||""); const id=Number(body.id||0); if(!id)throw new Error("Valid action ID is required.");
    const actor=actorFrom(auth.session);
    const data=action==="APPROVE"||action==="REJECT" ? await decideAction(id,action,actor) : action==="EXECUTE" ? await executeApprovedAction(id,actor) : (()=>{throw new Error("Action must be APPROVE, REJECT, or EXECUTE.")})();
    return NextResponse.json({success:true,verified:true,data});
  } catch(e) { return NextResponse.json({success:false,message:e instanceof Error?e.message:"Unable to update approval."},{status:400}); }
}
