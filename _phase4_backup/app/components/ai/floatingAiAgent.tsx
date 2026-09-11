"use client";

import {
  Bot,
  ChevronDown,
  Maximize2,
  Minimize2,
  Send,
  ShoppingCart,
  TrendingUp,
  PackageSearch,
  Users,
  Boxes,
  ReceiptText,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  text: string;
};

type QuickAction = {
  label: string;
  prompt: string;
  icon: React.ReactNode;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Today's Sales",
    prompt: "Show me today's sales.",
    icon: <TrendingUp size={15} />,
  },
  {
    label: "Low Stock",
    prompt: "Show me low stock products.",
    icon: <PackageSearch size={15} />,
  },
  {
    label: "Top Products",
    prompt: "Show me top selling products.",
    icon: <ShoppingCart size={15} />,
  },
  {
    label: "Inventory Summary",
    prompt: "Show me the inventory summary.",
    icon: <Boxes size={15} />,
  },
  {
    label: "Top Customers",
    prompt: "Show me top customers.",
    icon: <Users size={15} />,
  },
  {
    label: "Sales Report",
    prompt: "Give me a sales performance summary.",
    icon: <ReceiptText size={15} />,
  },
];

const STARTER_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    role: "assistant",
    text:
      "Hi! I’m your Hafiz Retail POS AI Copilot. Ask about sales, stock, customers, expenses, purchases and reports. Phase 4A is UI-only — live AI answers are connected next.",
  },
];

export default function FloatingAiAgent() {
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(STARTER_MESSAGES);

  const nextId = useRef(2);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;

    if (window.innerWidth < 640) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, open]);

  const statusText = useMemo(
    () => (open ? "Ready to help" : "Online"),
    [open]
  );

  function addMessage(role: ChatMessage["role"], text: string) {
    setMessages((current) => [
      ...current,
      {
        id: nextId.current++,
        role,
        text,
      },
    ]);
  }

  function submitPrompt(prompt: string) {
    const value = prompt.trim();

    if (!value) return;

    addMessage("user", value);

    window.setTimeout(() => {
      addMessage(
        "assistant",
        "UI is ready. In Phase 4B/4C this question will be answered from your verified analytics tools and real database data — not guessed values."
      );
    }, 250);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = input.trim();

    if (!value) return;

    setInput("");
    submitPrompt(value);
  }

  return (
    <>
      {/* FLOATING LAUNCHER */}
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
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {statusText}
              </p>
            </div>
          </button>
        )}
      </div>

      {/* BACKDROP */}
      {open && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[79] bg-slate-950/30 backdrop-blur-[1px] sm:bg-slate-950/20"
          aria-label="Close AI Copilot"
        />
      )}

      {/* COPILOT PANEL */}
      {open && (
        <section
          className={[
            "fixed z-[80] flex overflow-hidden border-slate-200 bg-white shadow-2xl transition-all",
            "inset-0 rounded-none border-0",
            maximized
              ? "sm:inset-4 sm:rounded-3xl sm:border"
              : "sm:bottom-5 sm:right-5 sm:top-20 sm:w-[420px] sm:rounded-3xl sm:border",
            !maximized ? "lg:w-[440px]" : "",
          ].join(" ")}
          aria-label="AI Copilot panel"
        >
          <div className="flex min-h-0 w-full flex-col">
            {/* HEADER */}
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
                      Phase 4A
                    </span>
                  </div>

                  <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Online · Business Assistant
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setMaximized((current) => !current)}
                    className="hidden h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/80 hover:text-slate-900 sm:flex"
                    aria-label={maximized ? "Restore panel" : "Maximize panel"}
                    title={maximized ? "Restore" : "Maximize"}
                  >
                    {maximized ? (
                      <Minimize2 size={17} />
                    ) : (
                      <Maximize2 size={17} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/80 hover:text-slate-900"
                    aria-label="Close AI Copilot"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* CONTENT */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70">
              {/* WELCOME */}
              <div className="p-3 sm:p-4">
                <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Sparkles size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">
                        Welcome, Ibad 👋
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        Ask about your POS data, reports, inventory, customers,
                        suppliers, purchases and expenses.
                      </p>
                    </div>
                  </div>
                </div>

                {/* QUICK ACTIONS */}
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Quick Actions
                      </h3>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Tap a question to preview the Copilot flow.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() => submitPrompt(action.prompt)}
                        className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40 hover:text-blue-700"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600">
                          {action.icon}
                        </span>
                        <span className="leading-4">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* CHAT */}
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
                          "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-5 shadow-sm sm:text-sm",
                          message.role === "user"
                            ? "rounded-br-md bg-blue-600 text-white"
                            : "rounded-bl-md border border-slate-200 bg-white text-slate-700",
                        ].join(" ")}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}

                  <div ref={bottomRef} />
                </div>
              </div>
            </div>

            {/* COMPOSER */}
            <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <label htmlFor="copilot-message" className="sr-only">
                    Ask AI Copilot
                  </label>

                  <textarea
                    id="copilot-message"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        handleSubmit(
                          event as unknown as React.FormEvent<HTMLFormElement>
                        );
                      }
                    }}
                    rows={1}
                    placeholder="Ask about sales, stock, customers..."
                    className="max-h-28 min-h-11 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                  aria-label="Send message"
                >
                  <Send size={18} />
                </button>
              </form>

              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-[10px] leading-4 text-slate-400 sm:text-[11px]">
                  Phase 4A UI preview. Live verified AI answers are connected next.
                </p>

                <button
                  type="button"
                  onClick={() => setMessages(STARTER_MESSAGES)}
                  className="shrink-0 text-[10px] font-semibold text-slate-500 transition hover:text-slate-800 sm:text-[11px]"
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
            transform: translate3d(-2px, 0px, 0);
          }

          25% {
            transform: translate3d(3px, -3px, 0);
          }

          50% {
            transform: translate3d(5px, 0px, 0);
          }

          75% {
            transform: translate3d(0px, 3px, 0);
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
