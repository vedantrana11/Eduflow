"use client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, FunnelChart, Funnel, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from "recharts";
import {
  Users, TrendingUp, CheckCircle, Clock,
  MessageSquare, DollarSign, AlertCircle, ArrowUp, ArrowDown
} from "lucide-react";
import { analyticsApi } from "@/lib/api";
import { DashboardStats } from "@/types";
import { formatCurrency, getInitials, STAGE_CONFIG } from "@/lib/utils";

// ─── Skeleton ────────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return <div className="skeleton h-[120px] rounded-xl" />;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  trend?: number;
  color: string;
  gradient: string;
}

function StatCard({ label, value, sub, icon: Icon, trend, color, gradient }: StatCardProps) {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "rgb(100 116 139)" }}>
            {label}
          </p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {sub && <p className="text-xs mt-1" style={{ color }}>{sub}</p>}
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: gradient }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 text-xs">
          {trend >= 0
            ? <ArrowUp size={12} className="text-emerald-400" />
            : <ArrowDown size={12} className="text-red-400" />}
          <span style={{ color: trend >= 0 ? "rgb(52 211 153)" : "rgb(248 113 113)" }}>
            {Math.abs(trend)}% vs last week
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-sm"
      style={{ background: "rgb(20, 20, 40)", border: "1px solid rgba(255,255,255,0.1)" }}>
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-medium" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

// ─── Mock data (used when API is not connected) ───────────────────────────────────
const MOCK_STATS: DashboardStats = {
  total_leads: 847,
  new_leads_today: 23,
  converted_leads: 164,
  conversion_rate: 19.4,
  pending_tasks: 31,
  overdue_tasks: 7,
  messages_today: 142,
  estimated_revenue: 82000,
  funnel: [
    { stage: "new", count: 230, percentage: 27.2 },
    { stage: "contacted", count: 195, percentage: 23.0 },
    { stage: "interested", count: 172, percentage: 20.3 },
    { stage: "documents_pending", count: 86, percentage: 10.2 },
    { stage: "applied", count: 64, percentage: 7.6 },
    { stage: "converted", count: 100, percentage: 11.8 },
  ],
  daily_activity: Array.from({ length: 14 }, (_, i) => ({
    date: new Date(Date.now() - (13 - i) * 86400000).toLocaleDateString("en", { month: "short", day: "numeric" }),
    leads_added: Math.floor(Math.random() * 20) + 5,
    messages_sent: Math.floor(Math.random() * 40) + 20,
    tasks_completed: Math.floor(Math.random() * 15) + 3,
  })),
  counselor_performance: [
    { counselor_id: "1", counselor_name: "Sarah Johnson", leads_assigned: 142, leads_converted: 31, conversion_rate: 21.8, messages_sent: 486 },
    { counselor_id: "2", counselor_name: "Mike Chen", leads_assigned: 118, leads_converted: 24, conversion_rate: 20.3, messages_sent: 392 },
    { counselor_id: "3", counselor_name: "Priya Sharma", leads_assigned: 97, leads_converted: 19, conversion_rate: 19.6, messages_sent: 311 },
    { counselor_id: "4", counselor_name: "James Williams", leads_assigned: 84, leads_converted: 14, conversion_rate: 16.7, messages_sent: 274 },
  ],
};

const STAGE_COLORS: Record<string, string> = {
  new: "#3b82f6",
  contacted: "#8b5cf6",
  interested: "#f59e0b",
  documents_pending: "#f97316",
  applied: "#06b6d4",
  converted: "#10b981",
  lost: "#ef4444",
};

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => analyticsApi.dashboard().then((r) => r.data),
  });

  const stats: DashboardStats = data || MOCK_STATS;

  return (
    <div className="space-y-6">
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              label="Total Leads" value={stats.total_leads.toLocaleString()}
              sub={`+${stats.new_leads_today} today`} icon={Users}
              trend={12} color="#60a5fa" gradient="rgba(59,130,246,0.12)"
            />
            <StatCard
              label="Converted" value={stats.converted_leads}
              sub={`${stats.conversion_rate}% rate`} icon={TrendingUp}
              trend={5} color="#34d399" gradient="rgba(16,185,129,0.12)"
            />
            <StatCard
              label="Pending Tasks" value={stats.pending_tasks}
              sub={`${stats.overdue_tasks} overdue`} icon={Clock}
              color="#f59e0b" gradient="rgba(245,158,11,0.12)"
            />
            <StatCard
              label="Revenue Est." value={formatCurrency(stats.estimated_revenue)}
              sub={`${stats.messages_today} msgs today`} icon={DollarSign}
              trend={8} color="#a78bfa" gradient="rgba(139,92,246,0.12)"
            />
          </>
        )}
      </div>

      {/* ── Activity Chart + Funnel ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Activity Chart */}
        <div className="xl:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-white">Daily Activity</h3>
              <p className="text-xs text-slate-500 mt-0.5">Last 14 days performance</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-violet-500 inline-block" />Leads</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-blue-500 inline-block" />Messages</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-emerald-500 inline-block" />Tasks</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.daily_activity}>
              <defs>
                <linearGradient id="gLead" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gMsg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="leads_added" name="Leads" stroke="#8b5cf6" fill="url(#gLead)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="messages_sent" name="Messages" stroke="#3b82f6" fill="url(#gMsg)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="tasks_completed" name="Tasks" stroke="#10b981" fill="none" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Funnel */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-white mb-1">Lead Funnel</h3>
          <p className="text-xs text-slate-500 mb-4">Pipeline distribution</p>
          <div className="space-y-2.5">
            {stats.funnel.map((item) => {
              const config = STAGE_CONFIG[item.stage as keyof typeof STAGE_CONFIG];
              const color = STAGE_COLORS[item.stage] || "#8b5cf6";
              return (
                <div key={item.stage}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">{config?.label || item.stage}</span>
                    <span className="text-slate-400">{item.count} ({item.percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="score-bar">
                    <div
                      className="score-bar-fill"
                      style={{ width: `${item.percentage}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Counselor Performance ── */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-white">Counselor Performance</h3>
            <p className="text-xs text-slate-500 mt-0.5">Leads assigned, converted, and messages sent</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full"
            style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}>
            All time
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Counselor", "Leads Assigned", "Converted", "Rate", "Messages", "Performance"].map((h) => (
                  <th key={h} className="pb-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: "rgb(100 116 139)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.counselor_performance.map((c, i) => (
                <motion.tr
                  key={c.counselor_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b"
                  style={{ borderColor: "rgba(255,255,255,0.04)" }}
                >
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", color: "white" }}>
                        {getInitials(c.counselor_name)}
                      </div>
                      <span className="font-medium text-white">{c.counselor_name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-slate-300">{c.leads_assigned}</td>
                  <td className="py-3 text-slate-300">{c.leads_converted}</td>
                  <td className="py-3">
                    <span className={`font-medium ${c.conversion_rate >= 20 ? "text-emerald-400" : c.conversion_rate >= 15 ? "text-yellow-400" : "text-red-400"}`}>
                      {c.conversion_rate}%
                    </span>
                  </td>
                  <td className="py-3 text-slate-300">{c.messages_sent}</td>
                  <td className="py-3 w-32">
                    <div className="score-bar">
                      <div
                        className="score-bar-fill"
                        style={{
                          width: `${c.conversion_rate * 4}%`,
                          background: c.conversion_rate >= 20 ? "#10b981" : c.conversion_rate >= 15 ? "#f59e0b" : "#ef4444"
                        }}
                      />
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Overdue Alert ── */}
      {stats.overdue_tasks > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">
            You have <strong>{stats.overdue_tasks} overdue tasks</strong>. Review them in the Tasks tab before your day starts.
          </p>
          <a href="/tasks?status=overdue" className="ml-auto text-xs text-red-400 hover:text-red-300 whitespace-nowrap font-medium">
            View tasks →
          </a>
        </motion.div>
      )}
    </div>
  );
}
