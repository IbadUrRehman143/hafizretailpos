import { NextResponse } from "next/server";
import { currentSession } from "@/src/lib/auth/currentUser";
import {
  PHASE7_TOOL_NAMES,
  Phase7AuthError,
  Phase7ValidationError,
  runPhase7Tool,
  type Phase7ToolName,
} from "@/src/lib/ai/phase7/registry";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await currentSession();
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

    const body = await request.json();
    const tool = String(body?.tool || "") as Phase7ToolName;

    if (!PHASE7_TOOL_NAMES.includes(tool)) {
      return NextResponse.json({ success: false, message: "Unknown Phase 7 tool." }, { status: 400 });
    }

    const args = body?.args && typeof body.args === "object" && !Array.isArray(body.args) ? body.args : {};
    const data = await runPhase7Tool(session, tool, args);

    return NextResponse.json({ success: true, verified: true, phase: 7, tool, data });
  } catch (error) {
    if (error instanceof Phase7AuthError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 403 });
    }
    if (error instanceof Phase7ValidationError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unable to run Phase 7 tool." },
      { status: 500 }
    );
  }
}
