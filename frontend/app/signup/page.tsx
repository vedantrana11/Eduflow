"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function SignupPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "", organization_id: "", role: "admin",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      const orgId = form.organization_id || form.email.split("@")[1]?.split(".")[0] || "default";
      const { data } = await authApi.signup({ ...form, organization_id: orgId });
      setAuth(data.user, data.access_token, data.refresh_token);
      toast.success("Workspace created! Welcome to EduFlow AI 🎉");
      router.push("/dashboard");
    } catch {
      // Handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "rgb(8,8,16)" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[460px]"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)" }}>
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">EduFlow AI</span>
        </div>

        <div className="glass-card p-8">
          <h1 className="text-2xl font-bold text-white mb-1">Create your workspace</h1>
          <p className="text-slate-400 text-sm mb-6">Get started with EduFlow AI in minutes</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name *</label>
              <input
                name="name" type="text" className="input-field"
                placeholder="Sarah Johnson" value={form.name}
                onChange={handleChange} required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Work Email *</label>
              <input
                name="email" type="email" className="input-field"
                placeholder="sarah@agency.com" value={form.email}
                onChange={handleChange} required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password *</label>
              <div className="relative">
                <input
                  name="password" type={showPassword ? "text" : "password"}
                  className="input-field pr-10" placeholder="Min 8 characters"
                  value={form.password} onChange={handleChange} required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Organization Name</label>
              <input
                name="organization_id" type="text" className="input-field"
                placeholder="My Education Agency" value={form.organization_id}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Your Role</label>
              <select name="role" className="input-field" value={form.role} onChange={handleChange}>
                <option value="admin">Admin (Owner)</option>
                <option value="manager">Manager</option>
                <option value="counselor">Counselor</option>
              </select>
            </div>

            <button
              type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base mt-2"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating workspace...
                </span>
              ) : "Create Workspace →"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-4">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <p className="text-center text-sm text-slate-400 mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
