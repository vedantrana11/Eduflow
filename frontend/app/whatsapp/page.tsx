"use client";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Search, Phone, ChevronRight, MessageSquare,
  Bot, Sparkles, Image, Paperclip, Clock, Check, CheckCheck, X
} from "lucide-react";
import toast from "react-hot-toast";
import { whatsappApi, aiApi } from "@/lib/api";
import { Conversation, Message } from "@/types";
import { formatRelativeTime, STAGE_CONFIG } from "@/lib/utils";
import { LeadStage } from "@/types";

// ─── Mock Data ────────────────────────────────────────────────────────────────────
const MOCK_CONVERSATIONS: Conversation[] = [
  { lead_id: "1", lead_name: "Aisha Rahman", lead_phone: "+1234567890", lead_stage: "interested", last_message: "Can you send me more details about the MBA program?", last_message_at: new Date(Date.now() - 3600000).toISOString(), unread_count: 2 },
  { lead_id: "2", lead_name: "Rahul Verma", lead_phone: "+9876543210", lead_stage: "documents_pending", last_message: "I have uploaded the documents. Please check.", last_message_at: new Date(Date.now() - 7200000).toISOString(), unread_count: 0 },
  { lead_id: "3", lead_name: "Fatima Al-Sayed", lead_phone: "+5551234567", lead_stage: "applied", last_message: "When will I get the university offer letter?", last_message_at: new Date(Date.now() - 86400000).toISOString(), unread_count: 1 },
  { lead_id: "4", lead_name: "Chen Wei", lead_phone: "+8612345678", lead_stage: "new", last_message: "Hello, I am interested in studying in USA.", last_message_at: new Date(Date.now() - 172800000).toISOString(), unread_count: 1 },
];

const MOCK_MESSAGES: Message[] = [
  { id: "m1", lead_id: "1", direction: "inbound", content: "Hi! I saw your ad about studying in the UK. Can you help me?", type: "text", status: "read", created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: "m2", lead_id: "1", direction: "outbound", content: "Hi Aisha! Welcome to EduFlow AI. I'd love to help you explore study options in the UK. What's your field of interest?", type: "text", status: "read", created_at: new Date(Date.now() - 7000000).toISOString() },
  { id: "m3", lead_id: "1", direction: "inbound", content: "I want to do MBA. What are the top universities?", type: "text", status: "read", created_at: new Date(Date.now() - 6800000).toISOString() },
  { id: "m4", lead_id: "1", direction: "outbound", content: "Great choice! For MBA in the UK, I'd recommend: 1. London Business School 2. Oxford Said 3. Cambridge Judge. All have excellent rankings. Shall I send you the application requirements?", type: "text", status: "delivered", created_at: new Date(Date.now() - 4000000).toISOString() },
  { id: "m5", lead_id: "1", direction: "inbound", content: "Can you send me more details about the MBA program?", type: "text", status: "read", created_at: new Date(Date.now() - 3600000).toISOString() },
];

const TEMPLATES = [
  { name: "follow_up_reminder", display_name: "Follow-up Reminder", body: "Hi {name}, this is a follow-up from EduFlow. Have you had a chance to review the information we sent?" },
  { name: "document_reminder", display_name: "Document Reminder", body: "Hi {name}, we noticed your documents are still pending. Please submit them to continue your application." },
  { name: "welcome_message", display_name: "Welcome Message", body: "Welcome to EduFlow AI, {name}! We're excited to help you with your education journey." },
];

// ─── Message Bubble ───────────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isOut = msg.direction === "outbound";
  return (
    <div className={`flex ${isOut ? "justify-end" : "justify-start"} mb-2`}>
      <div className={isOut ? "chat-bubble-out" : "chat-bubble-in"} style={{ maxWidth: "75%" }}>
        <p>{msg.content}</p>
        <div className={`flex items-center gap-1 mt-1 ${isOut ? "justify-end" : "justify-start"}`}>
          <span className="text-xs opacity-60">{formatRelativeTime(msg.created_at)}</span>
          {isOut && (
            msg.status === "read" ? <CheckCheck size={11} className="text-blue-300" /> :
            msg.status === "delivered" ? <CheckCheck size={11} className="opacity-50" /> :
            <Check size={11} className="opacity-50" />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Conversation List Item ───────────────────────────────────────────────────────
function ConvItem({ conv, active, onClick }: { conv: Conversation; active: boolean; onClick: () => void }) {
  const config = STAGE_CONFIG[conv.lead_stage as LeadStage];
  return (
    <motion.div
      onClick={onClick}
      className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all"
      whileHover={{ x: 2 }}
      style={{
        background: active ? "rgba(139,92,246,0.12)" : "transparent",
        border: active ? "1px solid rgba(139,92,246,0.2)" : "1px solid transparent",
      }}
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", color: "white" }}>
        {conv.lead_name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <p className="font-medium text-white text-sm truncate">{conv.lead_name}</p>
          <span className="text-xs text-slate-500 flex-shrink-0 ml-2">{formatRelativeTime(conv.last_message_at)}</span>
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5">{conv.last_message}</p>
        <span className={`text-xs ${config?.color}`}>{config?.label}</span>
      </div>
      {conv.unread_count > 0 && (
        <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: "#8b5cf6", color: "white" }}>
          {conv.unread_count}
        </span>
      )}
    </motion.div>
  );
}

export default function WhatsAppPage() {
  const [activeConv, setActiveConv] = useState<Conversation | null>(MOCK_CONVERSATIONS[0]);
  const [message, setMessage] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: convsData } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => whatsappApi.conversations().then((r) => r.data),
    placeholderData: { conversations: MOCK_CONVERSATIONS },
  });

  const { data: msgsData } = useQuery({
    queryKey: ["messages", activeConv?.lead_id],
    queryFn: () => activeConv ? whatsappApi.conversation(activeConv.lead_id).then((r) => r.data) : null,
    enabled: !!activeConv,
    placeholderData: { messages: MOCK_MESSAGES },
  });

  const conversations: Conversation[] = convsData?.conversations || MOCK_CONVERSATIONS;
  const messages: Message[] = msgsData?.messages || MOCK_MESSAGES;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMsg = useMutation({
    mutationFn: () => whatsappApi.send({
      lead_id: activeConv!.lead_id, content: message, type: "text"
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", activeConv?.lead_id] });
      setMessage("");
      toast.success("Message sent!");
    },
    onError: () => toast.error("Failed to send. Check WhatsApp configuration."),
  });

  const handleSend = () => {
    if (!message.trim() || !activeConv) return;
    sendMsg.mutate();
  };

  const generateAIReply = async () => {
    if (!activeConv) return;
    setLoadingAI(true);
    try {
      const lastMsg = messages.filter((m) => m.direction === "inbound").slice(-1)[0];
      const { data } = await aiApi.generateReply(activeConv.lead_id, {
        last_message: lastMsg?.content || "",
        tone: "professional",
      });
      setAiSuggestion(data.reply);
    } catch {
      toast.error("AI reply generation requires an OpenAI/Gemini API key");
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-112px)] gap-4">
      {/* ── Conversation List ── */}
      <div className="w-[320px] flex-shrink-0 glass-card flex flex-col overflow-hidden">
        <div className="p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <h3 className="font-semibold text-white mb-3">Conversations</h3>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input className="input-field pl-8 text-xs" placeholder="Search conversations..." />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((conv) => (
            <ConvItem
              key={conv.lead_id}
              conv={conv}
              active={activeConv?.lead_id === conv.lead_id}
              onClick={() => setActiveConv(conv)}
            />
          ))}
        </div>
      </div>

      {/* ── Chat Window ── */}
      <div className="flex-1 glass-card flex flex-col overflow-hidden">
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                  style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", color: "white" }}>
                  {activeConv.lead_name[0]}
                </div>
                <div>
                  <p className="font-semibold text-white">{activeConv.lead_name}</p>
                  <p className="text-xs text-slate-500">{activeConv.lead_phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={generateAIReply}
                  disabled={loadingAI}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-all"
                  style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa" }}
                >
                  {loadingAI ? (
                    <span className="w-3 h-3 border border-violet-400/50 border-t-violet-400 rounded-full animate-spin" />
                  ) : <Sparkles size={12} />}
                  AI Reply
                </button>
                <button onClick={() => setShowTemplates(!showTemplates)}
                  className="btn-secondary text-xs px-3 py-1.5">
                  Templates
                </button>
              </div>
            </div>

            {/* AI Suggestion Banner */}
            <AnimatePresence>
              {aiSuggestion && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="px-5 py-3"
                  style={{ background: "rgba(139,92,246,0.08)", borderBottom: "1px solid rgba(139,92,246,0.15)" }}
                >
                  <div className="flex items-start gap-2">
                    <Bot size={14} className="text-violet-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-violet-300 font-medium mb-1">AI Suggested Reply</p>
                      <p className="text-sm text-slate-300">{aiSuggestion}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => { setMessage(aiSuggestion); setAiSuggestion(null); }}
                        className="text-xs px-2 py-1 rounded-lg"
                        style={{ background: "rgba(139,92,246,0.2)", color: "#a78bfa" }}>
                        Use
                      </button>
                      <button onClick={() => setAiSuggestion(null)} className="text-slate-500 hover:text-slate-300">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col">
              {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
              <div ref={messagesEndRef} />
            </div>

            {/* Templates panel */}
            <AnimatePresence>
              {showTemplates && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                  className="overflow-hidden"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="p-4 grid grid-cols-3 gap-2">
                    {TEMPLATES.map((t) => (
                      <button
                        key={t.name}
                        onClick={() => { setMessage(t.body); setShowTemplates(false); }}
                        className="text-left p-3 rounded-xl text-xs transition-all"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgb(148 163 184)" }}
                      >
                        <p className="font-medium text-white mb-1">{t.display_name}</p>
                        <p className="truncate">{t.body.slice(0, 60)}...</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="p-4 flex items-end gap-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <textarea
                className="input-field flex-1 resize-none text-sm"
                rows={2}
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || sendMsg.isPending}
                className="btn-primary px-4 py-2.5 flex-shrink-0"
                style={{ opacity: !message.trim() ? 0.5 : 1 }}
              >
                <Send size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={40} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500">Select a conversation to start</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
