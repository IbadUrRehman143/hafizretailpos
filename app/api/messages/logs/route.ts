import { NextResponse } from "next/server";import { db } from "@/src/prisma/db";
export async function GET(){try{const logs=await db.orm.public.MessageLog.all();return NextResponse.json({success:true,logs:logs.sort((a,b)=>b.id-a.id).slice(0,500)});}catch{return NextResponse.json({success:false,message:"Failed to load message logs."},{status:500})}}
