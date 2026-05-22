"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Send, Bot, User, Star, FileText,
  MessageSquare, TrendingUp, Zap, RefreshCw, Copy
} from "lucide-react";
import toast from "react-hot-toast";
import { aiApi } from "@/lib/api";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  { icon: TrendingUp, label: "Score a lead", prompt: "How do I score leads effectively in our CRM? What signals should I look for?" },
  { icon: MessageSquare, label: "Draft follow-up", prompt: "Write me a follow-up WhatsApp message for a student interested in studying MBA in the UK who hasn't responded in 3 days." },
  { icon: FileText, label: "Document checklist", prompt: "What documents does a student typically need for a UK student visa application?" },
  { icon: Star, label: "Conversion tips", prompt: "What are the best practices to increase lead conversion rate for an education consultancy?" },
  { icon: Zap, label: "WhatsApp templates", prompt: "Create 3 high-converting WhatsApp message templates for following up with international students." },
  { icon: Bot, label: "Objection handling", prompt: "How should I handle a student who says 'It's too expensive' when discussing consultation fees?" },
];

const INITIAL_MESSAGE: ChatMessage = {
  id: "init",
  role: "assistant",
  content: "Hi! I'm **EduFlow AI Assistant** 👋\n\nI'm here to help you with:\n- 📊 **Lead scoring** and prioritization\n- 💬 **WhatsApp reply** generation\n- 📋 **Document checklists** for visa applications\n- 🎯 **Conversion strategies** for counselors\n- 📈 **Analytics insights** and recommendations\n\nWhat would you like help with today?",
  timestamp: new Date(),
};

function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""} mb-4`}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: isUser
            ? "linear-gradient(135deg, #8b5cf6, #3b82f6)"
            : "rgba(139,92,246,0.15)",
          border: isUser ? "none" : "1px solid rgba(139,92,246,0.3)"
        }}
      >
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-violet-400" />}
      </div>
      <div className={`flex-1 max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className="rounded-2xl px-4 py-3 text-sm"
          style={{
            background: isUser
              ? "linear-gradient(135deg, #7c3aed, #4f46e5)"
              : "rgba(255,255,255,0.06)",
            border: isUser ? "none" : "1px solid rgba(255,255,255,0.09)",
            color: isUser ? "white" : "rgb(226 232 240)",
            borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          }}
        >
          {/* Simple markdown-like rendering */}
          {msg.content.split("\n").map((line, i) => {
            if (line.startsWith("- ")) return <li key={i} className="ml-4 list-none">{line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}</li>;
            const parts = line.split(/\*\*(.*?)\*\*/g);
            return (
              <p key={i} className="leading-relaxed" style={{ marginBottom: line === "" ? "0.5rem" : 0 }}>
                {parts.map((part, j) => j % 2 === 0 ? part : <strong key={j}>{part}</strong>)}
              </p>
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-1 px-1">
          <span className="text-xs text-slate-600">
            {msg.timestamp.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })}
          </span>
          {!isUser && (
            <button
              onClick={() => { navigator.clipboard.writeText(msg.content); toast.success("Copied!"); }}
              className="text-slate-600 hover:text-slate-400"
            >
              <Copy size={11} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = text || input.trim();
    if (!content) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await aiApi.chat(content);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I need an **OpenAI or Gemini API key** to generate AI responses. Please add your key in **Settings → Integrations**.\n\nIn the meantime, here's a tip: The best follow-up strategy is to contact leads within **24 hours** of inquiry — response rates drop by 80% after the first day!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-112px)] gap-4">
      {/* Sidebar with quick actions */}
      <div className="w-[240px] flex-shrink-0 space-y-3">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-violet-400" />
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Quick Actions</h3>
          </div>
          <div className="space-y-1.5">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => sendMessage(action.prompt)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "rgb(148 163 184)",
                  fontSize: "0.8rem",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(139,92,246,0.1)";
                  e.currentTarget.style.color = "#a78bfa";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.color = "rgb(148 163 184)";
                }}
              >
                <action.icon size={13} className="flex-shrink-0" />
                {action.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-slate-500 mb-2">Powered by</p>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: "rgba(16,185,129,0.15)" }}>
              <Zap size={12} className="text-emerald-400" />
            </div>
            <span className="text-xs text-slate-300 font-medium">GPT-4o / Gemini</span>
          </div>
          <p className="text-xs text-slate-600 mt-2">Configure API key in Settings</p>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 glass-card flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.3))", border: "1px solid rgba(139,92,246,0.3)" }}>
              <Bot size={18} className="text-violet-400" />
            </div>
            <div>
              <p className="font-semibold text-white">EduFlow AI</p>
              <p className="text-xs text-emerald-400">Online</p>
            </div>
          </div>
          <button
            onClick={() => setMessages([INITIAL_MESSAGE])}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw size={13} />
            New Chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} msg={msg} />
          ))}

          {loading && (
            <div className="flex gap-3 mb-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}>
                <Bot size={14} className="text-violet-400" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}>
                <div className="flex gap-1.5 items-center h-5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex gap-3">
            <input
              className="input-field flex-1"
              placeholder="Ask anything about leads, counseling, documents, or strategy..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="btn-primary px-4 flex-shrink-0"
              style={{ opacity: !input.trim() || loading ? 0.5 : 1 }}
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-2 text-center">
            AI can make mistakes. Verify important information independently.
          </p>
        </div>
      </div>
    </div>
  );
}
