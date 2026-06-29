"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Send, Loader2, MessageSquare, Sparkles } from "lucide-react";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "PSG – Marseille : over 2,5 ou pas ? Donne ton verdict.",
  "Arsenal – Liverpool : buteur le plus probable et pourquoi ?",
  "Sur ce match, quel est le pari le plus logique selon toi ?",
  "Donne-moi le favori, le risque principal et une jauge de confiance.",
];

export function CoachChat({
  preview,
  perDay,
  used,
}: {
  preview: boolean;
  perDay: number | null;
  used: number;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaUsed, setQuotaUsed] = useState(used);
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    if (preview) {
      setError("Le Coach IA est inclus dans Pro et À vie.");
      return;
    }
    setError(null);
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur.");
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
        if (data.usage?.coachCount != null) setQuotaUsed(data.usage.coachCount);
        setTimeout(() => scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" }), 50);
      }
    } catch {
      setError("Impossible de contacter le coach.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-panel flex h-[calc(100svh-250px)] min-h-[430px] flex-col overflow-hidden rounded-lg sm:h-[calc(100dvh-220px)]">
      {preview && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-primary/5 px-3 py-2 text-xs sm:px-4">
          <span className="text-muted-foreground">Mode aperçu — le Coach IA est réservé aux membres Pro & À vie.</span>
          <Link href="/app/subscription" className="font-semibold text-primary hover:underline">Passer Pro</Link>
        </div>
      )}

      {!preview && (
        <div className="flex items-center justify-between gap-2 border-b border-border bg-background/25 px-3 py-2 text-xs sm:px-4">
          <span className="font-medium text-foreground/[0.85]">Coach IA</span>
          <span className="text-muted-foreground">
            {perDay === null ? "∞ questions" : `${Math.min(quotaUsed, perDay)} / ${perDay} aujourd'hui`}
          </span>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-3 sm:p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/[0.15] text-primary">
              <MessageSquare className="h-6 w-6" />
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">
              Pose ta question au Coach IA. Il s'appuie sur les vraies données et la méthodo PrediScore.
            </p>
            <div className="flex max-h-56 flex-col gap-2 overflow-y-auto pr-1 sm:max-h-none sm:overflow-visible sm:pr-0">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
              className="app-hover rounded-lg border border-border bg-background/40 px-3 py-2 text-xs text-foreground/80 hover:bg-primary/5"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[92%] whitespace-pre-wrap rounded-lg px-3.5 py-2.5 text-sm sm:max-w-[85%] sm:px-4 ${
                m.role === "user"
                  ? "bg-brand-gradient text-primary-foreground shadow-[0_12px_32px_hsl(var(--primary)/0.14)]"
                  : "border border-border bg-background/50 text-foreground/90"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background/50 px-4 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" /> Le coach réfléchit…
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-center text-sm text-destructive-foreground">
            {error}
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            disabled={preview}
            placeholder={preview ? "Passe Pro pour poser une question…" : "Pose ta question foot : buteur, tactique, forme…"}
            className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-background/70 px-4 text-base outline-none ring-primary/40 transition focus:border-primary focus:ring-2 sm:text-sm"
          />
          <button
            onClick={() => send(input)}
            disabled={preview || loading || !input.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-gradient text-primary-foreground transition hover:scale-[1.02] hover:opacity-95 disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-2 flex items-center gap-1 px-1 text-[10px] text-muted-foreground">
          <Sparkles className="h-3 w-3" /> Verdict clair en fin de réponse
        </p>
      </div>
    </div>
  );
}
