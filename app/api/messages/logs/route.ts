import {NextResponse} from "next/server"; import {db} from "@/src/prisma/db";
export async function GET(){const all=await db.orm.public.AuditLog.all();const logs=all.filter(x=>x.module==="Message").sort((a,b)=>b.id-a.id);return NextResponse.json({success:true,logs});}
