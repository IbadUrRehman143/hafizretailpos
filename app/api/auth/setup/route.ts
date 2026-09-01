import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";
import { hashPassword, validatePassword } from "@/src/lib/auth/password";
import { setSessionCookie } from "@/src/lib/auth/session";

export async function GET(){
  const users=await db.orm.public.AppUser.all();
  return NextResponse.json({success:true,setupRequired: users.length===0 || !users.some(u=>Boolean(u.passwordHash))});
}
export async function POST(request:NextRequest){
  try{
    const users=await db.orm.public.AppUser.all();
    if(users.some(u=>Boolean(u.passwordHash))) return NextResponse.json({success:false,message:"Initial setup is already complete."},{status:403});
    const body=await request.json(); const name=String(body.name||"Super Admin").trim(); const email=String(body.email||"").trim().toLowerCase(); const password=String(body.password||"");
    if(!email) return NextResponse.json({success:false,message:"Email is required."},{status:400});
    const passwordError=validatePassword(password); if(passwordError) return NextResponse.json({success:false,message:passwordError},{status:400});
    let roles=await db.orm.public.Role.all(); let role=roles.find(r=>r.name==="Super Admin");
    if(!role) role=await db.orm.public.Role.create({name:"Super Admin",description:"Full system access"});
    let user=users.find(u=>String(u.email).toLowerCase()===email);
    if(user){ user=await db.orm.public.AppUser.where({id:user.id}).update({passwordHash:hashPassword(password),status:"Active",roleId:role.id}); }
    else { user=await db.orm.public.AppUser.create({name,email,phone:"",passwordHash:hashPassword(password),status:"Active",roleId:role.id,branchId:null}); }
    await setSessionCookie(user.id);
    return NextResponse.json({success:true,message:"Super Admin setup complete."});
  }catch(error){ console.error("POST /api/auth/setup:",error); return NextResponse.json({success:false,message:"Setup failed."},{status:500}); }
}
