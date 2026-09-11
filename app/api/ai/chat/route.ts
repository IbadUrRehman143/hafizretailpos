import { NextResponse } from "next/server";

import { currentSession } from "@/src/lib/auth/currentUser";
import { answerNaturalLanguageQuestion } from "@/src/lib/ai/chat/runner";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await currentSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      message?: unknown;
      previousResponseId?: unknown;
    };

    const message = String(body.message ?? "").trim();

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: "Message is required.",
        },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          error: "Message is too long. Keep it under 2000 characters.",
        },
        { status: 400 }
      );
    }

    const previousResponseId =
      typeof body.previousResponseId === "string" &&
      body.previousResponseId.trim()
        ? body.previousResponseId.trim()
        : null;

    const result = await answerNaturalLanguageQuestion({
      message,
      previousResponseId,
    });

    return NextResponse.json({
      success: true,
      answer: result.answer,
      responseId: result.responseId,
      usedTools: result.usedTools,
      verified: result.usedTools.length > 0,
    });
  } catch (error) {
    console.error("POST /api/ai/chat:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to process the AI request.";

    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status }
    );
  }
}
