"use client";

import {
  Bot,
  Boxes,
  ChevronDown,
  Loader2,
  Maximize2,
  Minimize2,
  PackageSearch,
  ReceiptText,
  Send,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
  AI_TOOL_CATALOG,
  getToolCatalogItem,
  type AiToolCatalogItem,
} from "@/src/lib/ai/tools/catalog";
import type {
  AiToolArgs,
  AiToolName,
  AiToolResponse,
} from "@/src/lib/ai/tools/types";

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  text: string;
  kind?: "normal" | "verified" | "error";
};

type NaturalLanguageApiResponse = {
  success: boolean;
  answer?: string;
  responseId?: string | null;
  usedTools?: AiToolName[];
  verified?: boolean;
  error?: string;
};

const STARTER_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    role: "assistant",
    kind: "normal",
    text:
      "Welcome to Hafiz AI Copilot. You can now ask business questions naturally in English, Roman Urdu or Urdu. Business numbers still come only from permission-aware verified tools.",
  },
];

const QUICK_TOOLS: Array<{
  name: AiToolName;
  icon: ReactNode;
}> = [
  { name: "getTodaySales", icon: <TrendingUp size={15} /> },
  { name: "getLowStockProducts", icon: <PackageSearch size={15} /> },
  { name: "getTopSellingProducts", icon: <ShoppingCart size={15} /> },
  { name: "getInventoryValue", icon: <Boxes size={15} /> },
  { name: "getTopCustomers", icon: <Users size={15} /> },
  { name: "getExpenses", icon: <ReceiptText size={15} /> },
];

function money(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? "");
  return `Rs. ${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function pretty(value: unknown, depth = 0): string {
  if (value === null || value === undefined) return "No data.";

  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toLocaleString("en-US");
  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (Array.isArray(value)) {
    if (value.length === 0) return "No records found.";

    return value
      .slice(0, 8)
      .map((item, index) => {
        if (typeof item !== "object" || item === null) {
          return `${index + 1}. ${String(item)}`;
        }

        const row = item as Record<string, unknown>;
        const name =
          row.productName ??
          row.customerName ??
          row.name ??
          row.title ??
          row.invoiceNo ??
          row.id ??
          `Record ${index + 1}`;

        const details = [
          row.quantity !== undefined ? `Qty ${row.quantity}` : null,
          row.stock !== undefined ? `Stock ${row.stock}` : null,
          row.revenue !== undefined ? `Revenue ${money(row.revenue)}` : null,
          row.total !== undefined ? `Total ${money(row.total)}` : null,
          row.due !== undefined ? `Due ${money(row.due)}` : null,
          row.invoices !== undefined ? `${row.invoices} invoices` : null,
        ].filter(Boolean);

        return `${index + 1}. ${String(name)}${
          details.length ? ` — ${details.join(" · ")}` : ""
        }`;
      })
      .join("\n");
  }

  if (typeof value === "object") {
    const row = value as Record<string, unknown>;

    if (depth > 1) return JSON.stringify(row);

    const priority = [
      "invoiceCount",
      "revenue",
      "paid",
      "due",
      "products",
      "quantityProducts",
      "weightProducts",
      "totalQuantityStock",
      "totalWeightStock",
      "totalStock",
      "totalCostValue",
      "totalRetailValue",
      "potentialGrossMargin",
      "currentStock",
      "totalSoldQuantity",
      "salesRevenue",
      "estimatedGrossProfit",
      "count",
      "total",
    ];

    const lines: string[] = [];

    for (const key of priority) {
      if (row[key] === undefined) continue;

      const label = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (c) => c.toUpperCase());

      const currencyKeys = [
        "revenue",
        "paid",
        "due",
        "totalCostValue",
        "totalRetailValue",
        "potentialGrossMargin",
        "salesRevenue",
        "estimatedGrossProfit",
        "total",
      ];

      lines.push(
        `${label}: ${
          currencyKeys.includes(key) ? money(row[key]) : pretty(row[key], depth + 1)
        }`
      );
    }

    for (const [key, val] of Object.entries(row)) {
      if (priority.includes(key)) continue;
      if (
        ["product", "customer", "summary", "current", "previous"].includes(key) &&
        typeof val === "object" &&
        val !== null
      ) {
        lines.push(
          `${key.replace(/^./, (c) => c.toUpperCase())}:\n${pretty(
            val,
            depth + 1
          )}`
        );
      }
    }

    if (lines.length) return lines.join("\n");

    const simpleEntries = Object.entries(row)
      .filter(
        ([, val]) =>
          ["string", "number", "boolean"].includes(typeof val) ||
          val === null
      )
      .slice(0, 10);

    if (simpleEntries.length) {
      return simpleEntries
        .map(([key, val]) => `${key}: ${pretty(val, depth + 1)}`)
        .join("\n");
    }

    return "Verified data loaded successfully.";
  }

  return String(value);
}

async function runToolRequest(
  tool: AiToolName,
  args: AiToolArgs
): Promise<AiToolResponse> {
  const response = await fetch("/api/ai/tools", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ tool, args }),
  });

  const payload = (await response.json()) as AiToolResponse;

  if (!response.ok || !payload.success) {
    throw new Error(
      payload.error ||
        (response.status === 401
          ? "Your session has expired. Please sign in again."
          : response.status === 403
            ? "You do not have permission to view this data."
            : "Unable to run business tool.")
    );
  }

  return payload;
}

export default function FloatingAiAgent() {
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(STARTER_MESSAGES);
  const [loadingTool, setLoadingTool] = useState<AiToolName | null>(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [previousResponseId, setPreviousResponseId] = useState<string | null>(null);
  const [showAllTools, setShowAllTools] = useState(false);
  const [selectedTool, setSelectedTool] = useState<AiToolName>("getTodaySales");
  const [toolArgs, setToolArgs] = useState<AiToolArgs>({});
  const [input, setInput] = useState("");

  const nextId = useRef(2);
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedDefinition = useMemo(
    () => getToolCatalogItem(selectedTool),
    [selectedTool]
  );

  useEffect(() => {
    if (!open) return;

    const oldOverflow = document.body.style.overflow;
    if (window.innerWidth < 640) document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = oldOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, loadingTool, open]);

  function addMessage(
    role: ChatMessage["role"],
    text: string,
    kind: ChatMessage["kind"] = "normal"
  ) {
    setMessages((current) => [
      ...current,
      { id: nextId.current++, role, text, kind },
    ]);
  }

  async function executeTool(tool: AiToolName, args: AiToolArgs = {}) {
    if (loadingTool) return;

    const definition = getToolCatalogItem(tool);
    addMessage("user", definition?.label ?? tool);
    setLoadingTool(tool);

    try {
      const result = await runToolRequest(tool, args);
      addMessage(
        "assistant",
        `${definition?.label ?? tool}\n\n${pretty(result.data)}`,
        "verified"
      );
    } catch (error) {
      addMessage(
        "assistant",
        error instanceof Error
          ? error.message
          : "Unable to load verified business data.",
        "error"
      );
    } finally {
      setLoadingTool(null);
    }
  }

  function validateToolArgs(definition: AiToolCatalogItem) {
    for (const field of definition.fields) {
      if (
        field.required &&
        String(toolArgs[field.key] ?? "").trim() === ""
      ) {
        return `${field.label} is required.`;
      }
    }

    return "";
  }

  async function handleAdvancedRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDefinition) return;

    const validation = validateToolArgs(selectedDefinition);
    if (validation) {
      addMessage("assistant", validation, "error");
      return;
    }

    await executeTool(selectedTool, toolArgs);
  }

  async function handleFreeText(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = input.trim();
    if (!value || loadingChat || loadingTool) return;

    setInput("");
    addMessage("user", value);
    setLoadingChat(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          message: value,
          previousResponseId,
        }),
      });

      const payload = (await response.json()) as NaturalLanguageApiResponse;

      if (!response.ok || !payload.success) {
        throw new Error(
          payload.error ||
            (response.status === 401
              ? "Your session has expired. Please sign in again."
              : "Unable to process the AI request.")
        );
      }

      setPreviousResponseId(payload.responseId ?? null);

      const toolNote =
        payload.usedTools && payload.usedTools.length > 0
          ? `\n\nVerified via: ${payload.usedTools.join(", ")}`
          : "";

      addMessage(
        "assistant",
        `${payload.answer || "No response received."}${toolNote}`,
        payload.verified ? "verified" : "normal"
      );
    } catch (error) {
      addMessage(
        "assistant",
        error instanceof Error
          ? error.message
          : "Unable to process the AI request.",
        "error"
      );
    } finally {
      setLoadingChat(false);
    }
  }

  return (
    <>
      <div className="fixed bottom-4 right-3 z-[70] sm:bottom-6 sm:right-5 lg:bottom-7 lg:right-7">
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group flex items-center gap-2 rounded-2xl border border-blue-100 bg-white/95 p-2.5 pr-3 shadow-xl backdrop-blur transition hover:-translate-y-0.5 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 sm:p-3 sm:pr-4"
            aria-label="Open AI Copilot"
          >
            <div className="ai-agent-float relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 text-white shadow-lg sm:h-14 sm:w-14">
              <Bot size={27} strokeWidth={2.2} />
              <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
            </div>

            <div className="hidden text-left min-[430px]:block">
              <p className="text-xs font-bold text-slate-900 sm:text-sm">
                AI Copilot
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-emerald-600 sm:text-[11px]">
                <ShieldCheck size={11} />
                Verified tools
              </p>
            </div>
          </button>
        )}
      </div>

      {open && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[79] bg-slate-950/30 backdrop-blur-[1px] sm:bg-slate-950/20"
          aria-label="Close AI Copilot"
        />
      )}

      {open && (
        <section
          className={[
            "fixed z-[80] flex overflow-hidden border-slate-200 bg-white shadow-2xl",
            "inset-0 rounded-none border-0",
            maximized
              ? "sm:inset-4 sm:rounded-3xl sm:border"
              : "sm:bottom-5 sm:right-5 sm:top-20 sm:w-[430px] sm:rounded-3xl sm:border",
            !maximized ? "lg:w-[455px]" : "",
          ].join(" ")}
          aria-label="Hafiz AI Copilot"
        >
          <div className="flex min-h-0 w-full flex-col">
            <div className="relative overflow-hidden border-b border-blue-100 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 px-4 py-4 sm:px-5">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-200/30 blur-2xl" />

              <div className="relative flex items-center gap-3">
                <div className="ai-agent-float flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 text-white shadow-lg">
                  <Bot size={27} strokeWidth={2.2} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                      Hafiz AI Copilot
                    </h2>
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600 ring-1 ring-indigo-100">
                      Phase 5
                    </span>
                  </div>

                  <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    {loadingTool || loadingChat ? (
                      <Loader2 size={12} className="animate-spin text-blue-600" />
                    ) : (
                      <ShieldCheck size={12} className="text-emerald-600" />
                    )}
                    {loadingTool || loadingChat
                      ? "Thinking with verified business tools..."
                      : "Natural language · Verified tools"}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setMaximized((value) => !value)}
                    className="hidden h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/80 hover:text-slate-900 sm:flex"
                    aria-label={maximized ? "Restore panel" : "Maximize panel"}
                  >
                    {maximized ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/80 hover:text-slate-900"
                    aria-label="Close AI Copilot"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70">
              <div className="p-3 sm:p-4">
                <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Secure AI Foundation
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        Every tool checks the signed-in user's module permission
                        before the analytics function runs.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Quick Actions
                  </h3>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {QUICK_TOOLS.map(({ name, icon }) => {
                      const item = getToolCatalogItem(name);
                      return (
                        <button
                          key={name}
                          type="button"
                          disabled={Boolean(loadingTool)}
                          onClick={() =>
                            executeTool(
                              name,
                              name === "getTopSellingProducts" ||
                                name === "getTopCustomers"
                                ? { limit: 5 }
                                : {}
                            )
                          }
                          className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-700 disabled:cursor-wait disabled:opacity-60"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            {loadingTool === name ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              icon
                            )}
                          </span>
                          <span>{item?.label ?? name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => setShowAllTools((value) => !value)}
                    className="flex w-full items-center justify-between gap-3 p-3.5 text-left"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        All 14 Verified Tools
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Sales, inventory, products, customers, expenses and purchases.
                      </p>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-slate-400 transition ${
                        showAllTools ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showAllTools && (
                    <form
                      onSubmit={handleAdvancedRun}
                      className="border-t border-slate-100 p-3.5"
                    >
                      <label className="block">
                        <span className="text-xs font-bold text-slate-700">
                          Business Tool *
                        </span>
                        <select
                          value={selectedTool}
                          onChange={(event) => {
                            setSelectedTool(event.target.value as AiToolName);
                            setToolArgs({});
                          }}
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        >
                          {AI_TOOL_CATALOG.map((item) => (
                            <option key={item.name} value={item.name}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      {selectedDefinition && (
                        <p className="mt-2 text-[11px] leading-5 text-slate-500">
                          {selectedDefinition.description}
                        </p>
                      )}

                      {selectedDefinition?.fields.length ? (
                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {selectedDefinition.fields.map((field) => (
                            <label key={field.key} className="block">
                              <span className="text-[11px] font-semibold text-slate-600">
                                {field.label}
                                {field.required ? " *" : ""}
                              </span>
                              <input
                                type={field.type}
                                min={field.min}
                                max={field.max}
                                placeholder={field.placeholder}
                                value={String(toolArgs[field.key] ?? "")}
                                onChange={(event) =>
                                  setToolArgs((current) => ({
                                    ...current,
                                    [field.key]:
                                      field.type === "number" &&
                                      event.target.value !== ""
                                        ? Number(event.target.value)
                                        : event.target.value,
                                  }))
                                }
                                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                              />
                            </label>
                          ))}
                        </div>
                      ) : null}

                      <button
                        type="submit"
                        disabled={Boolean(loadingTool)}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
                      >
                        {loadingTool === selectedTool ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Sparkles size={16} />
                        )}
                        Run Verified Tool
                      </button>
                    </form>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={
                        message.role === "user"
                          ? "flex justify-end"
                          : "flex justify-start"
                      }
                    >
                      <div
                        className={[
                          "max-w-[92%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-xs leading-5 shadow-sm sm:text-sm",
                          message.role === "user"
                            ? "rounded-br-md bg-blue-600 text-white"
                            : message.kind === "verified"
                              ? "rounded-bl-md border border-emerald-200 bg-white text-slate-700"
                              : message.kind === "error"
                                ? "rounded-bl-md border border-red-200 bg-red-50 text-red-700"
                                : "rounded-bl-md border border-slate-200 bg-white text-slate-700",
                        ].join(" ")}
                      >
                        {message.kind === "verified" && (
                          <div className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                            <ShieldCheck size={12} />
                            Verified analytics
                          </div>
                        )}
                        {message.text}
                      </div>
                    </div>
                  ))}

                  {loadingTool && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-500 shadow-sm">
                        <Loader2 size={14} className="animate-spin text-blue-600" />
                        Running {getToolCatalogItem(loadingTool)?.label ?? loadingTool}...
                      </div>
                    </div>
                  )}

                  {loadingChat && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-indigo-200 bg-white px-3.5 py-2.5 text-xs text-slate-500 shadow-sm">
                        <Loader2 size={14} className="animate-spin text-indigo-600" />
                        Understanding your question and checking verified tools...
                      </div>
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
              <form onSubmit={handleFreeText} className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  rows={1}
                  placeholder="Ask: aaj ki sales kitni hain? product 1 ka stock? top 5 products?"
                  className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loadingChat || Boolean(loadingTool)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                  aria-label="Send"
                >
                  <Send size={18} />
                </button>
              </form>

              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-[10px] text-slate-400 sm:text-[11px]">
                  Natural language → permission check → verified tool → AI answer
                </p>
                <button
                  type="button"
                  onClick={() => { setMessages(STARTER_MESSAGES); setPreviousResponseId(null); }}
                  className="shrink-0 text-[10px] font-semibold text-slate-500 hover:text-slate-800 sm:text-[11px]"
                >
                  Clear chat
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <style jsx global>{`
        @keyframes hafiz-ai-agent-float {
          0%,
          100% {
            transform: translate3d(-2px, 0, 0);
          }
          25% {
            transform: translate3d(3px, -3px, 0);
          }
          50% {
            transform: translate3d(5px, 0, 0);
          }
          75% {
            transform: translate3d(0, 3px, 0);
          }
        }

        .ai-agent-float {
          animation: hafiz-ai-agent-float 3.8s ease-in-out infinite;
          will-change: transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .ai-agent-float {
            animation: none !important;
          }
        }
      `}</style>
    </>
  );
}
