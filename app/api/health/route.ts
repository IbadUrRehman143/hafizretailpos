import { NextResponse } from "next/server"; import { db } from "@/src/prisma/db";
export async function GET(){try{await db.orm.public.AppUser.all();return NextResponse.json({status:"ok",database:"ok",time:new Date().toISOString()});}catch{return NextResponse.json({status:"degraded",database:"error",time:new Date().toISOString()},{status:503})}}
