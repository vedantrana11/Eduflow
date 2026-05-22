"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  User, Users, Bell, Shield, Link, Check, X,
  MessageSquare, Database, Sparkles, FileSpreadsheet,
  ChevronRight, Edit2, Plus, Trash2
} from "lucide-react";
import toast from "react-hot-toast";
import { settingsApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { getInitials, formatDate } from "@/lib/utils";

const TABS = [
  { id: "profile", icon: User, label: "Profile" },
  { id: "team", icon: Users, label: "Team" },
  { id: "integrations", icon: Link, label: "Integrations" },
  { id: "notifications", icon: Bell, label: "Notifications" },
];

function IntegrationCard({
  icon: Icon,
  name,
  description,
  connected,
  color,
}: {
  icon: React.ElementType;
  name: string;
  description: string;
  connected: boolean;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div className="flex-1">
        <p className="font-medium text-white">{name}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-1.5 text-xs font-medium ${connected ? "text-emerald-400" : "text-slate-500"}`}>
          {connected
            ? <><Check size={12} /> Connected</>
            : <><X size={12} /> Not configured</>}
        </div>
        <button className="btn-secondary text-xs py-1.5 px-3">
          {connected ? "Configure" : "Connect"}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const { user, updateUser } = useAuthStore();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    avatar_url: user?.avatar_url || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const { data: integrations } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => settingsApi.integrations().then((r) => r.data),
    placeholderData: {
      whatsapp: { connected: false },
      openai: { connected: false, provider: "openai" },
      gemini: { connected: false },
      google_sheets: { connected: false },
    },
  });

  const { data: teamData } = useQuery({
    queryKey: ["team"],
    queryFn: () => settingsApi.team().then((r) => r.data),
    enabled: activeTab === "team",
    placeholderData: {
      members: [
        { id: "1", name: "Sarah Johnson", email: "sarah@agency.com", role: "admin", is_active: true, created_at: new Date().toISOString() },
        { id: "2", name: "Mike Chen", email: "mike@agency.com", role: "manager", is_active: true, created_at: new Date().toISOString() },
        { id: "3", name: "Priya Sharma", email: "priya@agency.com", role: "counselor", is_active: true, created_at: new Date().toISOString() },
      ]
    },
  });

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await settingsApi.updateProfile(profileForm);
      updateUser(profileForm);
      toast.success("Profile updated!");
    } catch { } finally { setSavingProfile(false); }
  };

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="w-[200px] flex-shrink-0">
        <div className="glass-card p-2 space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-item w-full ${activeTab === tab.id ? "active" : ""}`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-5">
        {/* ── Profile Tab ── */}
        {activeTab === "profile" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-5">Profile Information</h2>

              {/* Avatar */}
              <div className="flex items-center gap-5 mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold"
                  style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", color: "white" }}>
                  {user ? getInitials(user.name) : "?"}
                </div>
                <div>
                  <p className="font-semibold text-white">{user?.name}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{user?.email}</p>
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full capitalize"
                    style={{ background: "rgba(139,92,246,0.12)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}>
                    {user?.role}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Full Name</label>
                  <input className="input-field" value={profileForm.name}
                    onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Avatar URL</label>
                  <input className="input-field" placeholder="https://..." value={profileForm.avatar_url}
                    onChange={(e) => setProfileForm((p) => ({ ...p, avatar_url: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Email</label>
                  <input className="input-field" value={user?.email} disabled style={{ opacity: 0.6 }} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Organization</label>
                  <input className="input-field" value={user?.organization_id} disabled style={{ opacity: 0.6 }} />
                </div>
              </div>
              <div className="flex justify-end mt-5">
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="btn-primary"
                  style={{ opacity: savingProfile ? 0.7 : 1 }}
                >
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>

            {/* Password */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Change Password</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Current Password</label>
                  <input type="password" className="input-field" placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">New Password</label>
                  <input type="password" className="input-field" placeholder="••••••••" />
                </div>
              </div>
              <button className="btn-secondary mt-4">Update Password</button>
            </div>
          </motion.div>
        )}

        {/* ── Team Tab ── */}
        {activeTab === "team" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-white">Team Members</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{teamData?.members?.length} members</p>
                </div>
                <button className="btn-primary">
                  <Plus size={15} /> Invite Member
                </button>
              </div>
              <div className="space-y-3">
                {teamData?.members?.map((member: any) => (
                  <div key={member.id} className="flex items-center gap-4 p-3.5 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", color: "white" }}>
                      {getInitials(member.name)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white text-sm">{member.name}</p>
                      <p className="text-xs text-slate-500">{member.email}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full capitalize"
                      style={{
                        background: member.role === "admin" ? "rgba(239,68,68,0.1)" : "rgba(139,92,246,0.1)",
                        color: member.role === "admin" ? "#f87171" : "#a78bfa",
                        border: `1px solid ${member.role === "admin" ? "rgba(239,68,68,0.2)" : "rgba(139,92,246,0.2)"}`,
                      }}>
                      {member.role}
                    </span>
                    <button className="text-slate-600 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Integrations Tab ── */}
        {activeTab === "integrations" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="glass-card p-5">
              <h2 className="text-lg font-semibold text-white mb-4">Connected Integrations</h2>

              <div className="space-y-3">
                <IntegrationCard
                  icon={MessageSquare} name="WhatsApp Cloud API"
                  description="Send and receive WhatsApp messages. Add WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN to .env"
                  connected={integrations?.whatsapp?.connected || false}
                  color="#25d366"
                />
                <IntegrationCard
                  icon={Sparkles} name="OpenAI (GPT-4o)"
                  description="AI reply generation, lead scoring & conversation summaries. Add OPENAI_API_KEY to .env"
                  connected={integrations?.openai?.connected || false}
                  color="#10a37f"
                />
                <IntegrationCard
                  icon={Database} name="Google Gemini"
                  description="Alternative AI provider. Add GEMINI_API_KEY to .env"
                  connected={integrations?.gemini?.connected || false}
                  color="#4285f4"
                />
                <IntegrationCard
                  icon={FileSpreadsheet} name="Google Sheets"
                  description="Two-way sync for leads. Set up OAuth credentials.json and token.json in backend/"
                  connected={integrations?.google_sheets?.connected || false}
                  color="#34a853"
                />
              </div>
            </div>

            <div className="glass-card p-5">
              <h2 className="text-base font-semibold text-white mb-3">Environment Variables</h2>
              <p className="text-xs text-slate-500 mb-3">Configure these in your <code className="px-1 py-0.5 rounded text-violet-400" style={{ background: "rgba(139,92,246,0.1)" }}>backend/.env</code> file</p>
              <div className="space-y-2">
                {[
                  { key: "MONGODB_URL", hint: "MongoDB Atlas connection string" },
                  { key: "WHATSAPP_ACCESS_TOKEN", hint: "Meta Business WhatsApp token" },
                  { key: "WHATSAPP_PHONE_NUMBER_ID", hint: "WhatsApp phone number ID" },
                  { key: "OPENAI_API_KEY", hint: "OpenAI API key (sk-...)" },
                  { key: "GEMINI_API_KEY", hint: "Google Gemini API key" },
                  { key: "SECRET_KEY", hint: "JWT secret (use a long random string)" },
                ].map(({ key, hint }) => (
                  <div key={key} className="flex items-center gap-3 p-2.5 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)", fontFamily: "JetBrains Mono, monospace" }}>
                    <code className="text-violet-400 text-xs flex-1">{key}</code>
                    <span className="text-xs text-slate-600">{hint}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Notifications Tab ── */}
        {activeTab === "notifications" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-5">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { label: "New lead assigned to me", enabled: true },
                  { label: "Follow-up reminders", enabled: true },
                  { label: "Lead stage changes", enabled: false },
                  { label: "Overdue task alerts", enabled: true },
                  { label: "New WhatsApp messages", enabled: true },
                  { label: "Weekly performance report", enabled: false },
                ].map((pref) => (
                  <div key={pref.label} className="flex items-center justify-between py-3"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <p className="text-sm text-slate-300">{pref.label}</p>
                    <div
                      className="w-10 h-5 rounded-full relative cursor-pointer transition-all"
                      style={{ background: pref.enabled ? "#8b5cf6" : "rgba(255,255,255,0.1)" }}
                    >
                      <div
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                        style={{ left: pref.enabled ? "calc(100% - 18px)" : "2px" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn-primary mt-5">Save Preferences</button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
