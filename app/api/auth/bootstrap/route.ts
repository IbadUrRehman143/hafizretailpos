import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";
import { hashPassword } from "@/src/lib/password";
export async function POST(req:NextRequest){
 try{ const b=await req.json(); const users=await db.orm.public.AppUser.all(); const key=String(b.bootstrapKey||""); if(users.length>0 && (!process.env.AUTH_BOOTSTRAP_KEY || key!==process.env.AUTH_BOOTSTRAP_KEY)) return NextResponse.json({success:false,message:"Bootstrap key required."},{status:403});
 const email=String(b.email||"").trim().toLowerCase(), name=String(b.name||"Super Admin").trim(), password=String(b.password||""); if(!email||password.length<8)return NextResponse.json({success:false,message:"Email and 8+ character password required."},{status:400});
 let roles=await db.orm.public.Role.all(); let role=roles.find(r=>r.name.toLowerCase()==="super admin"); if(!role) role=await db.orm.public.Role.create({name:"Super Admin",description:"Full system access"});
 const existing=users.find(u=>u.email.toLowerCase()===email); const passwordHash=await hashPassword(password); if(existing) await db.orm.public.AppUser.where({id:existing.id}).update({passwordHash,status:"Active",roleId:role.id}); else await db.orm.public.AppUser.create({name,email,phone:"",passwordHash,status:"Active",roleId:role.id,branchId:null});
 return NextResponse.json({success:true,message:"Super Admin credentials configured."}); }catch(e){console.error(e);return NextResponse.json({success:false,message:"Bootstrap failed."},{status:500});}
}
