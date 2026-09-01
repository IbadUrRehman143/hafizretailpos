import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/src/prisma/db";

export const AUTH_COOKIE = "hafiz_session";
const SESSION_SECONDS = 60 * 60 * 12;

type SessionPayload = { id:number; email:string; name:string; role:string; roleId:number|null; branchId:number|null; permissions:string[]; exp:number };
const b64u=(v:string|Buffer)=>Buffer.from(v).toString("base64url");
function secret(){ const s=process.env.AUTH_SECRET; if(!s || s.length<32) throw new Error("AUTH_SECRET must be at least 32 characters."); return s; }
export function hashPassword(password:string){ if(password.length<8) throw new Error("Password must be at least 8 characters."); const salt=randomBytes(16); const hash=scryptSync(password,salt,64); return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`; }
export function verifyPassword(password:string, stored:string){ try { const [alg,saltHex,hashHex]=stored.split("$"); if(alg!=="scrypt") return false; const expected=Buffer.from(hashHex,"hex"); const actual=scryptSync(password,Buffer.from(saltHex,"hex"),expected.length); return timingSafeEqual(expected,actual); } catch { return false; } }
export function signSession(payload:Omit<SessionPayload,"exp">){ const body=b64u(JSON.stringify({...payload,exp:Math.floor(Date.now()/1000)+SESSION_SECONDS})); const sig=createHmac("sha256",secret()).update(body).digest("base64url"); return `${body}.${sig}`; }
export function verifySessionToken(token:string):SessionPayload|null { try { const [body,sig]=token.split("."); if(!body||!sig) return null; const expected=createHmac("sha256",secret()).update(body).digest(); const got=Buffer.from(sig,"base64url"); if(got.length!==expected.length||!timingSafeEqual(got,expected)) return null; const p=JSON.parse(Buffer.from(body,"base64url").toString()) as SessionPayload; return p.exp>Math.floor(Date.now()/1000)?p:null; } catch{return null;} }
export async function setSessionCookie(payload:Omit<SessionPayload,"exp">){ const store=await cookies(); store.set(AUTH_COOKIE,signSession(payload),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:SESSION_SECONDS}); }
export async function clearSessionCookie(){ const store=await cookies(); store.set(AUTH_COOKIE,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:0}); }
export async function currentSession(){ const store=await cookies(); return verifySessionToken(store.get(AUTH_COOKIE)?.value||""); }
export async function buildUserSession(user:{id:number;email:string;name:string;roleId:number|null;branchId:number|null}){ const [roles,permissions]=await Promise.all([db.orm.public.Role.all(),db.orm.public.RolePermission.all()]); const role=roles.find(r=>r.id===user.roleId); return {id:user.id,email:user.email,name:user.name,role:role?.name||"",roleId:user.roleId,branchId:user.branchId,permissions: role?.name==="Super Admin"?["*"]:permissions.filter(p=>p.roleId===user.roleId).map(p=>p.permission)}; }
export function hasPermission(session:SessionPayload,module:string,action="view"){ if(session.role==="Super Admin"||session.permissions.includes("*")) return true; return session.permissions.includes(`${module}.${action}`)||session.permissions.includes(module); }
