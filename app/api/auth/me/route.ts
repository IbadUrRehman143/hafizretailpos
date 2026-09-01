import { NextResponse } from "next/server";
import { db } from "@/src/prisma/db";
import { getSession } from "@/src/lib/auth/session";
export async function GET(){
  const session=await getSession();
  if(!session) return NextResponse.json({success:false},{status:401});
  const user=await db.orm.public.AppUser.where({id:session.userId}).first();
  if(!user || user.status!=="Active") return NextResponse.json({success:false},{status:401});
  const roles=await db.orm.public.Role.all(); const permissions=await db.orm.public.RolePermission.all();
  const role=roles.find(r=>r.id===user.roleId);
  return NextResponse.json({success:true,user:{id:user.id,name:user.name,email:user.email,role:role?.name||"",permissions:permissions.filter(p=>p.roleId===user.roleId).map(p=>p.permission)}});
}
