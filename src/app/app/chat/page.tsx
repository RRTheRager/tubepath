"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Send, Sparkles, X } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { useSession } from "@/components/providers/SessionProvider";
import { PremiumGate } from "@/components/access/PremiumGate";
import { Loading } from "@/components/ui/Loading";
import { YouTubeConnectPrompt } from "@/components/youtube/YouTubeConnectPrompt";
import { useYouTubeLinked } from "@/components/youtube/useYouTubeLinked";
import { AI_SUPPORT_MESSAGE } from "@/lib/ai/constants";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Why did my views drop last week?",
  "Rewrite the title of my latest video",
  "Generate tags for my newest upload",
  "How do I grow faster?",
];

function uid() {
  return Math.random().toString(36).slice(2);
}

export default function ChatPage() {
  const { data: session, loading } = useSession();
  const { hasChannel, loading: ytLoading } = useYouTubeLinked();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  if (loading || ytLoading) return <Loading />;

  if (!session?.capabilities.ai) {
    return (
      <PremiumGate
        title="Meet your AI Coach"
        description="A chatbot that knows your numbers and can act on them."
        perks={[
          "Ask why a metric moved and get a real answer",
          "One-tap rewrites for titles & descriptions",
          "Generate and apply tags instantly",
          "Personalized growth strategy on demand",
        ]}
      />
    );
  }

  if (!hasChannel) {
    return <YouTubeConnectPrompt variant="select-channel" />;
  }

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || thinking) return;
    const userMsg: ChatMessage = { id: uid(), role: "user", content };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });
      const json = await res.json();
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "assistant",
          content: json.content ?? AI_SUPPORT_MESSAGE,
          pendingAction: json.pendingAction,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: uid(), role: "assistant", content: AI_SUPPORT_MESSAGE },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const applyAction = async (msg: ChatMessage) => {
    if (!msg.pendingAction) return;
    setApplyingId(msg.id);
    try {
      const res = await fetch("/api/ai/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msg.pendingAction),
      });
      const json = await res.json();
      setMessages((m) =>
        m.map((x) =>
          x.id === msg.id
            ? {
                ...x,
                pendingAction: undefined,
                actionResult: json.actionResult ?? "Done.",
              }
            : x
        )
      );
    } finally {
      setApplyingId(null);
    }
  };

  const dismissAction = (msg: ChatMessage) => {
    setMessages((m) =>
      m.map((x) =>
        x.id === msg.id
          ? { ...x, pendingAction: undefined, actionResult: "Action dismissed." }
          : x
      )
    );
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col md:h-[calc(100vh-4rem)]">
      <div className="mb-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Sparkles className="h-6 w-6 text-primary" /> AI Coach
        </h1>
        <p className="text-sm text-muted-foreground">
          Knows your channel. Can take action.
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white">
              <Sparkles className="h-7 w-7" />
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">
              Ask about your performance, or tell me to optimize a video. I can
              apply changes for you with your approval.
            </p>
            <div className="mt-5 flex max-w-md flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex",
              m.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "mac-card"
              )}
            >
              <p className="whitespace-pre-line leading-relaxed">{m.content}</p>

              {m.pendingAction && (
                <div className="mt-3 rounded-lg border border-primary/30 bg-primary/8 p-3">
                  <p className="text-xs font-semibold text-primary">
                    Proposed action
                  </p>
                  <p className="mt-0.5 text-sm">{m.pendingAction.label}</p>
                  <div className="mt-2.5 flex gap-2">
                    <button
                      onClick={() => applyAction(m)}
                      disabled={applyingId === m.id}
                      className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
                    >
                      {applyingId === m.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      Apply
                    </button>
                    <button
                      onClick={() => dismissAction(m)}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                    >
                      <X className="h-3.5 w-3.5" /> Dismiss
                    </button>
                  </div>
                </div>
              )}

              {m.actionResult && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-success/12 px-2 py-1 text-xs font-medium text-success">
                  <Check className="h-3.5 w-3.5" /> {m.actionResult}
                </p>
              )}
            </div>
          </div>
        ))}

        <AnimatePresence>
          {thinking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="mac-card flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Ask your AI coach..."
          className="h-12 flex-1 rounded-xl border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={() => send(input)}
          disabled={thinking || !input.trim()}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
