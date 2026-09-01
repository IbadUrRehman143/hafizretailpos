import { redirect } from "next/navigation";
import { currentSession } from "@/src/lib/auth/currentUser";
export default async function ProtectedDashboardLayout({children}:{children:React.ReactNode}){ const session=await currentSession(); if(!session) redirect("/login"); return children; }
