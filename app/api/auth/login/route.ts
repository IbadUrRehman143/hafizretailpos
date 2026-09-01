import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";
import { AUTH_COOKIE, createSessionToken } from "@/src/lib/auth";
import { verifyPassword } from "@/src/lib/password";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const users = await db.orm.public.AppUser.all();
    const user = users.find(u => u.email.toLowerCase() === email);
    if (!user || user.status !== "Active" || !(await verifyPassword(password, user.passwordHash))) return NextResponse.json({success:false,message:"Invalid email or password."},{status:401});
    const roles = await db.orm.public.Role.all();
    const role = roles.find(r => r.id === user.roleId);
    if (!role) return NextResponse.json({success:false,message:"User role is not configured."},{status:403});
    const allPerms = await db.orm.public.RolePermission.all();
    const permissions = allPerms.filter(p => p.roleId === role.id).map(p => p.permission);
    const token = await createSessionToken({userId:user.id,name:user.name,email:user.email,role:role.name,branchId:user.branchId ?? null,permissions});
    await db.orm.public.AppUser.where({id:user.id}).update({lastLoginAt:new Date().toISOString()});
    const res = NextResponse.json({success:true,user:{id:user.id,name:user.name,email:user.email,role:role.name,branchId:user.branchId,permissions}});
    res.cookies.set(AUTH_COOKIE, token, {httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*12});
    return res;
  } catch (e) { console.error(e); return NextResponse.json({success:false,message:"Login failed."},{status:500}); }
}
