"use client";
import { Bell, Search, Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Overview of your operations" },
  "/leads": { title: "Lead Management", subtitle: "Your student pipeline" },
  "/analytics": { title: "Analytics", subtitle: "Performance insights" },
  "/whatsapp": { title: "WhatsApp Center", subtitle: "Messages & automation" },
  "/tasks": { title: "Tasks & Reminders", subtitle: "Your follow-up queue" },
  "/ai-assistant": { title: "AI Assistant", subtitle: "Powered by GPT-4 / Gemini" },
  "/settings": { title: "Settings", subtitle: "Account & integrations" },
};

export function Header() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const page = PAGE_TITLES[pathname] || { title: "EduFlow AI", subtitle: "" };
  const [darkMode] = useState(true);

  return (
    <header
      className="flex items-center justify-between px-6 py-4 sticky top-0 z-30"
      style={{
        background: "rgba(8, 8, 16, 0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Page title */}
      <div>
        <h1 className="text-lg font-semibold text-white">{page.title}</h1>
        {page.subtitle && (
          <p className="text-xs mt-0.5" style={{ color: "rgb(100 116 139)" }}>{page.subtitle}</p>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgb(100 116 139)",
          }}
        >
          <Search size={14} />
          <span>Search leads...</span>
          <kbd className="text-xs px-1.5 py-0.5 rounded ml-2"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
            ⌘K
          </kbd>
        </div>

        {/* Notification bell */}
        <button
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <Bell size={16} className="text-slate-400" />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: "#8b5cf6" }}
          />
        </button>

        {/* Role badge */}
        <div
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium"
          style={{
            background: "rgba(139,92,246,0.12)",
            border: "1px solid rgba(139,92,246,0.2)",
            color: "#a78bfa",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
          <span className="capitalize">{user?.role}</span>
        </div>
      </div>
    </header>
  );
}
