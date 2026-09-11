import { NextResponse } from "next/server";

import {
  AiToolAuthError,
  AiToolValidationError,
  isAiToolName,
  runVerifiedAiTool,
} from "@/src/lib/ai/tools/registry";
import type { AiToolArgs } from "@/src/lib/ai/tools/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      tool?: unknown;
      args?: unknown;
    };

    const tool = String(body.tool ?? "");

    if (!isAiToolName(tool)) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: "Unknown AI tool.",
        },
        { status: 400 }
      );
    }

    const args =
      body.args &&
      typeof body.args === "object" &&
      !Array.isArray(body.args)
        ? (body.args as AiToolArgs)
        : {};

    const result = await runVerifiedAiTool(tool, args);

    return NextResponse.json({
      success: true,
      verified: true,
      tool: result.tool,
      data: result.data,
      permission: result.permission,
    });
  } catch (error) {
    if (error instanceof AiToolAuthError) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: error.message,
        },
        { status: error.status }
      );
    }

    if (error instanceof AiToolValidationError) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: error.message,
        },
        { status: error.status }
      );
    }

    console.error("POST /api/ai/tools:", error);

    return NextResponse.json(
      {
        success: false,
        verified: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to run the verified business tool.",
      },
      { status: 500 }
    );
  }
}
