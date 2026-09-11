import { NextResponse } from "next/server";
import {
  isPhase6ToolName,
  runPhase6Tool,
} from "@/src/lib/ai/phase6/registry";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { tool?: unknown; args?: unknown };
    const tool = String(body.tool ?? "");
    if (!isPhase6ToolName(tool)) {
      return NextResponse.json({ success: false, error: "Unknown Phase 6 tool." }, { status: 400 });
    }

    const args =
      body.args && typeof body.args === "object" && !Array.isArray(body.args)
        ? (body.args as Record<string, unknown>)
        : {};

    const data = await runPhase6Tool(tool, args);
    return NextResponse.json({ success: true, verified: true, tool, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to run inventory intelligence tool.";
    const status = message.includes("Authentication") ? 401 : message.includes("permission") ? 403 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
