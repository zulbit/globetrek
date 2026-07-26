import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatMessage = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "globetrek-ai-chat-v1";
const CHIP_REGEX = /\[\[choose:\s*([^\]]+)\]\]/i;

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Assalam-o-Alaikum! ✈️ Welcome to **GlobeTrek PK** — your 24/7 travel concierge!\n\nAap English ya Roman Urdu mein baat kar sakte hain. Aapko kis cheez mein madad chahiye?\n\n[[choose: 🇵🇰 Roman Urdu | 🇬🇧 English | 🌴 Tour Packages | 📄 Visa Services | 🛡️ Travel Insurance | ✈️ Flight Tickets]]",
};

function parseChips(content: string): { text: string; chips: string[] } {
  const m = content.match(CHIP_REGEX);
  if (!m) return { text: content, chips: [] };
  return {
    text: content.replace(CHIP_REGEX, "").trim(),
    chips: m[1].split("|").map((s) => s.trim()).filter(Boolean),
  };
}

const COUNTRY_FLAGS: Record<string, string> = {
  turkey: "🇹🇷",
  thailand: "🇹🇭",
  uae: "🇦🇪",
  dubai: "🇦🇪",
  europe: "🇪🇺",
  malaysia: "🇲🇾",
  singapore: "🇸🇬",
  vietnam: "🇻🇳",
  uk: "🇬🇧",
  "saudi arabia": "🇸🇦",
  umrah: "🕋",
  hajj: "🕋",
  pakistan: "🇵🇰",
};

function getChipStyle(chipText: string): { label: string; className: string } {
  const lower = chipText.toLowerCase().trim();

  if (lower.includes("roman urdu")) {
    return {
      label: chipText.includes("🇵🇰") ? chipText : "Roman Urdu 🇵🇰",
      className:
        "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/30 hover:border-emerald-400 shadow-xs shadow-emerald-950/40",
    };
  }
  if (lower.includes("english")) {
    return {
      label: chipText.includes("🇬🇧") ? chipText : "English 🇬🇧",
      className:
        "border-sky-500/40 bg-sky-500/15 text-sky-300 hover:bg-sky-500/30 hover:border-sky-400 shadow-xs shadow-sky-950/40",
    };
  }
  if (lower.includes("tour") || lower.includes("package")) {
    return {
      label: chipText.startsWith("🌴") ? chipText : `🌴 ${chipText}`,
      className:
        "border-emerald-500/50 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/35 hover:border-emerald-400 shadow-xs shadow-emerald-950/40",
    };
  }
  if (lower.includes("visa")) {
    return {
      label: chipText.startsWith("📄") ? chipText : `📄 ${chipText}`,
      className:
        "border-sky-500/50 bg-sky-500/20 text-sky-200 hover:bg-sky-500/35 hover:border-sky-400 shadow-xs shadow-sky-950/40",
    };
  }
  if (lower.includes("insurance") || lower.includes("insure")) {
    return {
      label: chipText.startsWith("🛡️") ? chipText : `🛡️ ${chipText}`,
      className:
        "border-teal-500/50 bg-teal-500/20 text-teal-200 hover:bg-teal-500/35 hover:border-teal-400 shadow-xs shadow-teal-950/40",
    };
  }
  if (lower.includes("ticket") || lower.includes("flight")) {
    return {
      label: chipText.startsWith("✈️") ? chipText : `✈️ ${chipText}`,
      className:
        "border-amber-500/50 bg-amber-500/20 text-amber-200 hover:bg-amber-500/35 hover:border-amber-400 shadow-xs shadow-amber-950/40",
    };
  }

  // Check country flags
  for (const [key, flag] of Object.entries(COUNTRY_FLAGS)) {
    if (lower.includes(key)) {
      const hasFlag = chipText.includes(flag);
      return {
        label: hasFlag ? chipText : `${flag} ${chipText}`,
        className:
          "border-primary/50 bg-primary/20 text-primary-foreground hover:bg-primary/35 hover:border-primary shadow-xs shadow-primary/20 font-medium",
      };
    }
  }

  return {
    label: chipText,
    className:
      "border-primary/40 bg-primary/10 text-primary hover:bg-primary/25 hover:border-primary/60",
  };
}

export function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage after mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore quota */
    }
  }, [messages]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, sending]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => res.statusText);
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: `Sorry — I hit an error: ${errText || "unknown"}` };
          return copy;
        });
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
      if (!acc.trim()) {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: "…I didn't get a reply. Try rephrasing?" };
          return copy;
        });
      }
    } catch (err) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content: `Network error: ${err instanceof Error ? err.message : "unknown"}`,
        };
        return copy;
      });
    } finally {
      setSending(false);
    }
  }

  function clearChat() {
    setMessages([GREETING]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      {/* Floating trigger */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open travel concierge"
          className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-2xl shadow-emerald-900/40 ring-2 ring-emerald-400/50 transition duration-300 hover:scale-110 hover:shadow-emerald-500/40 md:bottom-6"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-background" />
          </span>
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-emerald-500/30",
            "bg-card/95 shadow-2xl backdrop-blur-2xl",
            "bottom-20 right-4 h-[75vh] w-[calc(100vw-2rem)] max-w-md md:bottom-6 md:h-[620px]",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/70 bg-gradient-to-r from-emerald-950/40 via-surface-2/60 to-teal-950/40 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm ring-1 ring-emerald-400/40">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-foreground">
                  Travel Concierge
                  <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                    AI
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  GlobeTrek PK · online
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition hover:bg-surface hover:text-foreground"
              >
                Clear
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-md p-1.5 text-muted-foreground transition hover:bg-surface hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3.5 overflow-y-auto p-4">
            {messages.map((m, i) => {
              const isLast = i === messages.length - 1;
              if (m.role === "assistant" && m.content.length === 0) return null;
              const { text, chips } = m.role === "assistant" ? parseChips(m.content) : { text: m.content, chips: [] };
              return (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    m.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                      m.role === "user"
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium shadow-emerald-950/30"
                        : "border border-border/60 bg-surface-2/90 text-foreground",
                    )}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                            strong: ({ children }) => {
                              const textContent = String(children).trim();
                              // Highlight price formats (e.g. ₨ 385,000 or Rs 45,000 or PKR 35,000)
                              if (/^(₨|rs\.?|pkr|\$)\s*[\d,]+/i.test(textContent)) {
                                return (
                                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 font-bold tabular-nums text-emerald-300 shadow-xs">
                                    {children}
                                  </span>
                                );
                              }
                              return <strong className="font-semibold text-emerald-300">{children}</strong>;
                            },
                            ul: ({ children }) => (
                              <ul className="my-2 space-y-1 pl-4 list-disc marker:text-emerald-400">{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="my-2 space-y-1 pl-4 list-decimal marker:text-emerald-400">{children}</ol>
                            ),
                            li: ({ children }) => <li className="my-0.5 text-sm text-foreground/90">{children}</li>,
                          }}
                        >
                          {text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <span className="whitespace-pre-wrap">{text}</span>
                    )}

                    {(chips.length > 0 || isLast) && chips.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5 pt-1.5 border-t border-border/30">
                        {chips.map((chipText) => {
                          const { label, className } = getChipStyle(chipText);
                          return (
                            <button
                              key={chipText}
                              disabled={sending}
                              onClick={() => sendMessage(chipText)}
                              className={cn(
                                "rounded-full border px-3 py-1 text-xs transition duration-200 hover:scale-105 active:scale-95 disabled:opacity-50",
                                className,
                              )}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {sending && (() => {
              const last = messages[messages.length - 1];
              if (last?.role === "assistant" && last.content.length > 0) return null;
              const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content.toLowerCase() ?? "";
              const dynamic = /turkey|thailand|uae|europe|dubai|singapore|vietnam|malaysia|bangkok|istanbul|destination|tour|trip|place/.test(lastUser)
                ? "Searching catalog for departures…"
                : /budget|price|pkr|rs|rupee|cost|cheap|under|below/.test(lastUser)
                  ? "Calculating rates in PKR…"
                  : /visa|passport|document|embassy/.test(lastUser)
                    ? "Looking up visa requirement & fees…"
                    : /ticket|flight|airline|umrah|hajj/.test(lastUser)
                      ? "Finding ticketing agents…"
                      : "Thinking…";
              return (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-surface-2/90 px-4 py-2.5 text-sm text-muted-foreground shadow-xs">
                    <span className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400" />
                    </span>
                    <span className="text-xs font-medium text-emerald-400">{dynamic}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Quick Suggestion Chips (Always present above input) */}
          <div className="flex items-center gap-1.5 overflow-x-auto border-t border-border/40 bg-surface-2/50 px-3 py-2 no-scrollbar">
            {[
              { label: "🌴 Tour Packages", action: "Show me popular tour packages" },
              { label: "📄 Visa Services", action: "What visa services do you offer?" },
              { label: "🛡️ Travel Insurance", action: "Tell me about travel insurance plans" },
              { label: "✈️ Flight Tickets", action: "Help me book flight tickets" },
              { label: "🇹🇷 Turkey Tours", action: "Show Turkey tour packages" },
              { label: "🇦🇪 Dubai / UAE", action: "Show Dubai UAE packages" },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                disabled={sending}
                onClick={() => sendMessage(chip.action)}
                className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300 transition hover:bg-emerald-500/25 hover:border-emerald-400 disabled:opacity-50"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center gap-2 border-t border-border/70 bg-gradient-to-r from-surface-2/70 via-surface/70 to-surface-2/70 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Turkey 🇹🇷, Visas 📄, Prices in PKR ₨…"
              disabled={sending}
              className="flex-1 rounded-full border border-border bg-background/90 px-4 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40"
            />
            <Button
              type="submit"
              disabled={sending || !input.trim()}
              className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white p-0 shadow-md shadow-emerald-950/40 hover:from-emerald-500 hover:to-teal-400"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
