import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatMessage = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "globetrek-ai-chat-v1";
const CHIP_REGEX = /\[\[choose:\s*([^\]]+)\]\]/i;

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Assalam-o-Alaikum! Welcome to GlobeTrek PK. How can I help you today? Aap English ya Roman Urdu mein baat kar sakte hain. [[choose: English 🇬🇧 | Roman Urdu 🇵🇰 | Visa Services | Tour Packages]]",
};

function parseChips(content: string): { text: string; chips: string[] } {
  const m = content.match(CHIP_REGEX);
  if (!m) return { text: content, chips: [] };
  return {
    text: content.replace(CHIP_REGEX, "").trim(),
    chips: m[1].split("|").map((s) => s.trim()).filter(Boolean),
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
    // Optimistic: add user message + empty assistant placeholder we'll stream into
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
          className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/30 ring-1 ring-primary/50 transition hover:scale-105 hover:shadow-primary/50 md:bottom-6"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-border/60",
            "bg-surface/80 shadow-2xl backdrop-blur-xl",
            "bottom-20 right-4 h-[70vh] w-[calc(100vw-2rem)] max-w-md md:bottom-6 md:h-[600px]",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 bg-surface-2/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">Travel Concierge</div>
                <div className="text-[11px] text-muted-foreground">GlobeTrek PK · online</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-surface hover:text-foreground"
              >
                Clear
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-md p-1 text-muted-foreground hover:bg-surface hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => {
              const isLast = i === messages.length - 1;
              // Skip the empty assistant placeholder — the typing indicator covers that state
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
                      "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-2/80 text-foreground",
                    )}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                        <ReactMarkdown>{text}</ReactMarkdown>
                      </div>
                    ) : (
                      <span className="whitespace-pre-wrap">{text}</span>
                    )}
                    {isLast && chips.length > 0 && !sending && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {chips.map((chip) => (
                          <button
                            key={chip}
                            onClick={() => sendMessage(chip)}
                            className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary transition hover:bg-primary/20"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {sending && (() => {
              const last = messages[messages.length - 1];
              // Only show typing indicator until the first streamed token arrives
              if (last?.role === "assistant" && last.content.length > 0) return null;
              const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content.toLowerCase() ?? "";
              const dynamic = /turkey|thailand|uae|europe|dubai|singapore|vietnam|malaysia|bangkok|istanbul|destination|tour|trip|place/.test(lastUser)
                ? "Searching the catalog…"
                : /budget|price|pkr|rs|rupee|cost|cheap|under|below/.test(lastUser)
                  ? "Checking prices…"
                  : /compare|vs|difference|better/.test(lastUser)
                    ? "Comparing tours…"
                    : /detail|itinerary|day|include/.test(lastUser)
                      ? "Loading itinerary…"
                      : "Thinking…";
              return (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-surface-2/80 px-3.5 py-2 text-sm text-muted-foreground">
                    <span className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                    </span>
                    {dynamic}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center gap-2 border-t border-border/60 bg-surface-2/50 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Turkey, Thailand, Europe…"
              disabled={sending}
              className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60"
            />
            <Button
              type="submit"
              size="icon"
              disabled={sending || !input.trim()}
              className="h-9 w-9 shrink-0 rounded-full"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
