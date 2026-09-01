import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/src/lib/auth";
export async function POST(){ const r=NextResponse.json({success:true}); r.cookies.set(AUTH_COOKIE,"",{httpOnly:true,path:"/",maxAge:0}); return r; }
