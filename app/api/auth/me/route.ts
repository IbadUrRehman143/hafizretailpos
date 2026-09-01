import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, verifySessionToken } from "@/src/lib/auth";
export async function GET(){ const c=await cookies(); const s=await verifySessionToken(c.get(AUTH_COOKIE)?.value); return s?NextResponse.json({success:true,user:s}):NextResponse.json({success:false,message:"Unauthorized"},{status:401}); }
