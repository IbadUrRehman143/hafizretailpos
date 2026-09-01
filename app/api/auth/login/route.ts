import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";
import { verifyPassword } from "@/src/lib/auth/password";
import { setSessionCookie } from "@/src/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!email || !password) return NextResponse.json({ success:false, message:"Email and password are required." }, {status:400});
    const users = await db.orm.public.AppUser.all();
    const user = users.find(u => String(u.email).toLowerCase() === email);
    if (!user || user.status !== "Active" || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ success:false, message:"Invalid email or password." }, {status:401});
    }
    await db.orm.public.AppUser.where({ id:user.id }).update({ lastLoginAt:new Date().toISOString() });
    await setSessionCookie(user.id);
    return NextResponse.json({ success:true, message:"Login successful.", user:{id:user.id,name:user.name,email:user.email} });
  } catch (error) {
    console.error("POST /api/auth/login:", error);
    return NextResponse.json({ success:false, message:"Login failed." }, {status:500});
  }
}
