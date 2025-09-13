"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Msg = { role: "user" | "assistant"; content: string };

export function PageAssistant({ enabled }: { enabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const path = usePathname();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const pageContext = useMemo(() => {
    if (typeof document === "undefined") return "";
    const main = document.querySelector("main") || document.body;
    const text = (main?.textContent || "").replace(/\s+/g, " ").trim();
    return text.slice(0, 4000);
  }, [path, open]);

  useEffect(() => {
    if (!open) return;
    // On first open, if no chat yet, auto explain
    if (messages.length === 0) {
      void submit("Explain this page");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [messages, loading]);

  async function submit(text?: string) {
    const prompt = (text ?? input).trim();
    if (!prompt) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: prompt }]);
    setLoading(true);
    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, context: pageContext, path }),
      });
      const j = await res.json();
      const reply = j.reply || j.error || "Sorry, I couldn’t get an answer.";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: e?.message || "Error" }]);
    } finally {
      setLoading(false);
    }
  }

  if (enabled === false) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-blue-600 text-white shadow-lg px-4 py-3 text-sm hover:bg-blue-700"
          aria-label="Open assistant"
        >
          Need help?
        </button>
      ) : (
        <div className="w-[360px] max-w-[92vw] bg-white text-gray-900 shadow-2xl rounded-xl border overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
            <div className="text-sm font-semibold">Page Assistant</div>
            <button className="text-gray-500 hover:text-gray-700" onClick={() => setOpen(false)} aria-label="Close">✕</button>
          </div>
          <div ref={containerRef} className="h-72 overflow-y-auto px-3 py-2 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <div className={`inline-block rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-left">
                <div className="inline-block rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-900">Thinking…</div>
              </div>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
            className="flex items-center gap-2 p-2 border-t bg-white"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this page…"
              className="flex-1 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
            <button type="submit" disabled={loading} className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50">
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

