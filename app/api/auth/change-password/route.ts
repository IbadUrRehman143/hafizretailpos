import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/src/prisma/db";
import { AUTH_COOKIE, verifySessionToken } from "@/src/lib/auth";
import { hashPassword, verifyPassword } from "@/src/lib/password";
export async function POST(req:NextRequest){ const c=await cookies(); const s=await verifySessionToken(c.get(AUTH_COOKIE)?.value); if(!s)return NextResponse.json({success:false,message:"Unauthorized"},{status:401}); const b=await req.json(); const u=await db.orm.public.AppUser.where({id:s.userId}).first(); if(!u||!(await verifyPassword(String(b.currentPassword||""),u.passwordHash)))return NextResponse.json({success:false,message:"Current password is incorrect."},{status:400}); try{await db.orm.public.AppUser.where({id:u.id}).update({passwordHash:await hashPassword(String(b.newPassword||""))});return NextResponse.json({success:true,message:"Password changed."});}catch(e){return NextResponse.json({success:false,message:e instanceof Error?e.message:"Failed"},{status:400});}}
