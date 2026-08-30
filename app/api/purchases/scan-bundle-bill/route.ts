import { NextRequest, NextResponse } from "next/server";

type ExtractedWeight = {
  value: number;
  confidence: number;
  uncertain: boolean;
};

type ScanResult = {
  weights: ExtractedWeight[];
};

function cleanWeight(value: unknown): number | null {
  const weight = Number(value);

  if (!Number.isFinite(weight) || weight <= 0) {
    return null;
  }

  return Number(weight.toFixed(2));
}

function normalizeConfidence(value: unknown): number {
  const confidence = Number(value);

  if (!Number.isFinite(confidence)) {
    return 0.5;
  }

  return Math.max(0, Math.min(1, confidence));
}

function normalizeScanResult(data: unknown): ScanResult {
  if (!data || typeof data !== "object") {
    return { weights: [] };
  }

  const record = data as Record<string, unknown>;

  if (!Array.isArray(record.weights)) {
    return { weights: [] };
  }

  const weights: ExtractedWeight[] = [];

  for (const item of record.weights) {
    // Also accept:
    // { "weights": [34, 60, 70] }
    if (typeof item === "number" || typeof item === "string") {
      const value = cleanWeight(item);

      if (value !== null) {
        weights.push({
          value,
          confidence: 0.8,
          uncertain: false,
        });
      }

      continue;
    }

    if (!item || typeof item !== "object") {
      continue;
    }

    const weightRecord = item as Record<string, unknown>;

    const value = cleanWeight(weightRecord.value);

    if (value === null) {
      continue;
    }

    const confidence = normalizeConfidence(weightRecord.confidence);

    weights.push({
      value,
      confidence,
      uncertain:
        typeof weightRecord.uncertain === "boolean"
          ? weightRecord.uncertain
          : confidence < 0.75,
    });
  }

  return { weights };
}

function extractOutputText(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "";
  }

  const record = data as Record<string, unknown>;

  if (
    typeof record.output_text === "string" &&
    record.output_text.trim()
  ) {
    return record.output_text.trim();
  }

  if (!Array.isArray(record.output)) {
    return "";
  }

  const parts: string[] = [];

  for (const outputItem of record.output) {
    if (!outputItem || typeof outputItem !== "object") {
      continue;
    }

    const outputRecord = outputItem as Record<string, unknown>;

    if (!Array.isArray(outputRecord.content)) {
      continue;
    }

    for (const contentItem of outputRecord.content) {
      if (!contentItem || typeof contentItem !== "object") {
        continue;
      }

      const contentRecord = contentItem as Record<string, unknown>;

      if (
        typeof contentRecord.text === "string" &&
        contentRecord.text.trim()
      ) {
        parts.push(contentRecord.text.trim());
      }
    }
  }

  return parts.join("\n");
}

function parseJsonText(text: string): unknown {
  let cleaned = text.trim();

  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(cleaned);
}

function getErrorMessage(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "Could not scan the bundle bill.";
  }

  const record = data as Record<string, unknown>;

  if (
    record.error &&
    typeof record.error === "object"
  ) {
    const errorRecord = record.error as Record<string, unknown>;

    if (typeof errorRecord.message === "string") {
      return errorRecord.message;
    }
  }

  if (typeof record.message === "string") {
    return record.message;
  }

  return "Could not scan the bundle bill.";
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            "OPENAI_API_KEY is missing. Add it to .env.local and restart the development server.",
        },
        { status: 500 }
      );
    }

    /*
     * ---------------------------------------------------------
     * IMAGE INPUT
     * Supports BOTH:
     *
     * 1. JSON
     * {
     *   image: "data:image/jpeg;base64,..."
     * }
     *
     * 2. multipart/form-data
     * file / image / bill
     * ---------------------------------------------------------
     */

    const contentType =
      request.headers.get("content-type") || "";

    let imageDataUrl = "";

    if (contentType.includes("application/json")) {
      const body: unknown = await request.json();

      if (!body || typeof body !== "object") {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid request body.",
          },
          { status: 400 }
        );
      }

      const record = body as Record<string, unknown>;

      const imageValue =
        typeof record.image === "string"
          ? record.image
          : typeof record.imageDataUrl === "string"
            ? record.imageDataUrl
            : typeof record.bill === "string"
              ? record.bill
              : "";

      if (!imageValue) {
        return NextResponse.json(
          {
            success: false,
            message: "Image data is required.",
          },
          { status: 400 }
        );
      }

      if (!imageValue.startsWith("data:image/")) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid image format. Expected a base64 image data URL.",
          },
          { status: 400 }
        );
      }

      imageDataUrl = imageValue;
    } else if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      const formData = await request.formData();

      const fileValue =
        formData.get("file") ??
        formData.get("image") ??
        formData.get("bill");

      if (!(fileValue instanceof File)) {
        return NextResponse.json(
          {
            success: false,
            message: "Please upload a bundle bill image.",
          },
          { status: 400 }
        );
      }

      if (!fileValue.type.startsWith("image/")) {
        return NextResponse.json(
          {
            success: false,
            message: "Uploaded file must be an image.",
          },
          { status: 400 }
        );
      }

      const maxFileSize = 10 * 1024 * 1024;

      if (fileValue.size > maxFileSize) {
        return NextResponse.json(
          {
            success: false,
            message: "Image is too large. Maximum size is 10 MB.",
          },
          { status: 400 }
        );
      }

      const bytes = await fileValue.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString("base64");

      imageDataUrl =
        `data:${fileValue.type};base64,${base64}`;
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `Unsupported Content-Type: ${
            contentType || "unknown"
          }`,
        },
        { status: 415 }
      );
    }

    if (!imageDataUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Image data could not be prepared.",
        },
        { status: 400 }
      );
    }

    /*
     * ---------------------------------------------------------
     * OPENAI MODEL
     * ---------------------------------------------------------
     */

    const model =
      process.env.OPENAI_VISION_MODEL?.trim() ||
      "gpt-4.1-mini";

    /*
     * ---------------------------------------------------------
     * SEND IMAGE TO OPENAI
     * ---------------------------------------------------------
     */

    const openAIResponse = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          model,

          input: [
            {
              role: "user",

              content: [
                {
                  type: "input_text",

                  text: `
You are reading a supplier bundle-weight bill for a retail inventory system.

Your ONLY job is to identify individual physical bundle weights written on the bill.

Important rules:

1. Read handwritten and printed bundle weights.
2. Preserve the order in which the weights appear on the bill.
3. Every physical bundle must be a separate entry.
4. Do NOT calculate totals.
5. Do NOT include:
   - grand totals
   - subtotals
   - prices
   - invoice numbers
   - dates
   - phone numbers
   - quantities that are not bundle weights
6. Do not invent unreadable values.
7. If a value is partially readable, include your best reading but mark it uncertain.
8. confidence must be between 0 and 1.
9. uncertain should be true whenever you are not reasonably confident.
10. Return JSON only.

The bundle weights on these bills are commonly handwritten as numbers separated by + signs.

Examples:

28 + 30 + 33 + 31

means four different physical bundles:

28 KG
30 KG
33 KG
31 KG

Do NOT treat their sum as one bundle.

Required JSON format:

{
  "weights": [
    {
      "value": 34,
      "confidence": 0.98,
      "uncertain": false
    },
    {
      "value": 56,
      "confidence": 0.62,
      "uncertain": true
    }
  ]
}

If no bundle weights can be reliably detected:

{
  "weights": []
}
                  `.trim(),
                },

                {
                  type: "input_image",
                  image_url: imageDataUrl,
                },
              ],
            },
          ],
        }),
      }
    );

    /*
     * ---------------------------------------------------------
     * READ OPENAI RESPONSE
     * ---------------------------------------------------------
     */

    let responseData: unknown;

    try {
      responseData = await openAIResponse.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "OpenAI returned an invalid response.",
        },
        { status: 502 }
      );
    }

    if (!openAIResponse.ok) {
      console.error(
        "OpenAI scan error:",
        JSON.stringify(responseData, null, 2)
      );

      return NextResponse.json(
        {
          success: false,
          message: getErrorMessage(responseData),
        },
        {
          status:
            openAIResponse.status >= 400
              ? openAIResponse.status
              : 500,
        }
      );
    }

    /*
     * ---------------------------------------------------------
     * EXTRACT MODEL TEXT
     * ---------------------------------------------------------
     */

    const outputText =
      extractOutputText(responseData);

    if (!outputText) {
      console.error(
        "No output text from OpenAI:",
        JSON.stringify(responseData, null, 2)
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "The scan completed but no readable result was returned.",
        },
        { status: 422 }
      );
    }

    /*
     * ---------------------------------------------------------
     * PARSE JSON
     * ---------------------------------------------------------
     */

    let parsedResult: unknown;

    try {
      parsedResult = parseJsonText(outputText);
    } catch (error) {
      console.error(
        "Unable to parse scan JSON:",
        outputText,
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "The bill was scanned, but the result could not be parsed. Please try a clearer photo.",
        },
        { status: 422 }
      );
    }

    /*
     * ---------------------------------------------------------
     * NORMALIZE WEIGHTS
     * ---------------------------------------------------------
     */

    const result =
      normalizeScanResult(parsedResult);

    if (result.weights.length === 0) {
      return NextResponse.json({
        success: true,

        message:
          "No bundle weights were confidently detected. Please try a clearer photo or enter the weights manually.",

        weights: [],

        totalBundles: 0,

        totalWeight: 0,

        requiresReview: true,
      });
    }

    /*
     * ---------------------------------------------------------
     * TOTALS
     * ---------------------------------------------------------
     */

    const totalWeight =
      result.weights.reduce(
        (sum, item) => sum + item.value,
        0
      );

    const uncertainCount =
      result.weights.filter(
        (item) => item.uncertain
      ).length;

    /*
     * ---------------------------------------------------------
     * RETURN SCAN RESULT
     *
     * IMPORTANT:
     * Nothing is saved to purchase/inventory here.
     * User must Review → Confirm Import → Save Purchase.
     * ---------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      message:
        `${result.weights.length} bundle weights detected. ` +
        `${uncertainCount > 0 ? `${uncertainCount} need review. ` : ""}` +
        "Review them before confirming.",

      weights: result.weights,

      totalBundles:
        result.weights.length,

      totalWeight:
        Number(totalWeight.toFixed(2)),

      uncertainCount,

      requiresReview: true,

      weightEntries:
        result.weights
          .map((item) => item.value)
          .join("+"),
    });
  } catch (error) {
    console.error(
      "Scan Bundle Bill Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to scan bundle bill.",
      },
      { status: 500 }
    );
  }
}