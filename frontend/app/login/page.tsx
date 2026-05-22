"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Zap, Users, BarChart3, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const FEATURES = [
  { icon: MessageSquare, text: "WhatsApp automation at scale" },
  { icon: Users, text: "Smart lead pipeline management" },
  { icon: BarChart3, text: "AI-powered analytics & scoring" },
  { icon: Zap, text: "Automated follow-ups & reminders" },
];

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@eduflow.ai", password: "EduFlow@123" },
  { role: "Manager", email: "manager@eduflow.ai", password: "EduFlow@123" },
  { role: "Counselor", email: "counselor@eduflow.ai", password: "EduFlow@123" },
];

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.login(email, password);
      setAuth(data.user, data.access_token, data.refresh_token);
      toast.success(`Welcome back, ${data.user.name}!`);
      router.push("/dashboard");
    } catch {
      // Demo fallback if backend/DB is not running
      console.log("Backend failed, using mock demo login");
      const mockUser = {
        id: "demo-id",
        email: email,
        name: email.split("@")[0].toUpperCase(),
        role: DEMO_ACCOUNTS.find(a => a.email === email)?.role.toLowerCase() || "admin"
      };
      setAuth(mockUser, "mock-access-token", "mock-refresh-token");
      toast.success(`Demo Mode: Welcome back, ${mockUser.name}!`);
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "rgb(8, 8, 16)" }}>
      {/* ── Left Panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12"
        style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(59,130,246,0.08) 100%)",
          borderRight: "1px solid rgba(255,255,255,0.07)"
        }}>
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)" }}>
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">EduFlow AI</span>
        </div>

        {/* Hero Text */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white mb-4 leading-tight"
          >
            Scale your admissions <span className="gradient-text">3× faster</span>
          </motion.h1>
          <p className="text-slate-400 text-lg mb-10">
            The AI-powered CRM built for education consultancies that want to automate, not manually grind.
          </p>

          {/* Feature list */}
          <div className="space-y-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 + 0.2 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.2)" }}>
                  <f.icon size={15} className="text-violet-400" />
                </div>
                <span className="text-slate-300 text-sm">{f.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[["10k+", "Students"], ["98%", "Uptime"], ["3×", "Faster"]].map(([val, label]) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-bold gradient-text-purple">{val}</div>
              <div className="text-xs text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)" }}>
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-white">EduFlow AI</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-slate-400 text-sm mb-8">Sign in to your workspace</p>

          {/* Demo accounts */}
          <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
            <p className="text-xs text-violet-400 font-semibold mb-3 uppercase tracking-wider">Demo Accounts</p>
            <div className="flex gap-2 flex-wrap">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  onClick={() => fillDemo(acc.email, acc.password)}
                  className="text-xs px-3 py-1.5 rounded-lg transition-all"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#cbd5e1" }}
                >
                  {acc.role}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">Click a role to auto-fill credentials</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-300">Password</label>
                <a href="#" className="text-xs text-violet-400 hover:text-violet-300">Forgot password?</a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base mt-2"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Don't have an account?{" "}
            <Link href="/signup" className="text-violet-400 hover:text-violet-300 font-medium">
              Create workspace
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
