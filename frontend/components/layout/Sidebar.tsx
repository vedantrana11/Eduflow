"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, BarChart3, MessageSquare,
  CheckSquare, Sparkles, Settings, Zap, LogOut,
  ChevronLeft, Bell
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getInitials } from "@/lib/utils";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/leads", icon: Users, label: "Leads" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/whatsapp", icon: MessageSquare, label: "WhatsApp" },
  { href: "/tasks", icon: CheckSquare, label: "Tasks" },
  { href: "/ai-assistant", icon: Sparkles, label: "AI Assistant" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  return (
    <motion.aside
      className="sidebar"
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)" }}
        >
          <Zap size={18} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="font-bold text-white text-base overflow-hidden whitespace-nowrap"
            >
              EduFlow AI
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? "active" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={18} className="icon flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "0.75rem" }}>
        {/* User */}
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", color: "white" }}
          >
            {user ? getInitials(user.name) : "?"}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-hidden"
              >
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs capitalize" style={{ color: "rgb(148 163 184)" }}>{user?.role}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="nav-item w-full"
          title={collapsed ? "Expand" : "Collapse"}
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronLeft size={18} />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Logout */}
        <button onClick={handleLogout} className="nav-item w-full text-red-400 hover:text-red-300">
          <LogOut size={18} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
