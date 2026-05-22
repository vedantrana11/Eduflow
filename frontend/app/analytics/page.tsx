"use client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp, Users, DollarSign, Target } from "lucide-react";
import { analyticsApi } from "@/lib/api";
import { DashboardStats, FunnelData } from "@/types";
import { STAGE_CONFIG } from "@/lib/utils";
import { LeadStage } from "@/types";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-sm"
      style={{ background: "rgb(20,20,40)", border: "1px solid rgba(255,255,255,0.1)" }}>
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-medium" style={{ color: p.color || p.fill }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

const STAGE_COLORS: Record<string, string> = {
  new: "#3b82f6", contacted: "#8b5cf6", interested: "#f59e0b",
  documents_pending: "#f97316", applied: "#06b6d4", converted: "#10b981", lost: "#ef4444",
};

const MOCK_FUNNEL: FunnelData[] = [
  { stage: "new", count: 230, percentage: 27.2 },
  { stage: "contacted", count: 195, percentage: 23 },
  { stage: "interested", count: 172, percentage: 20.3 },
  { stage: "documents_pending", count: 86, percentage: 10.2 },
  { stage: "applied", count: 64, percentage: 7.6 },
  { stage: "converted", count: 100, percentage: 11.8 },
];

const MOCK_SOURCES = [
  { source: "Website", count: 245 },
  { source: "Referral", count: 187 },
  { source: "Instagram", count: 143 },
  { source: "Facebook", count: 96 },
  { source: "Google", count: 78 },
  { source: "Walk-in", count: 42 },
  { source: "Other", count: 56 },
];

const SOURCE_COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#f97316", "#06b6d4", "#ec4899"];

export default function AnalyticsPage() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: () => analyticsApi.dashboard().then((r) => r.data),
  });

  const { data: sourcesData } = useQuery({
    queryKey: ["lead-sources"],
    queryFn: () => analyticsApi.sources().then((r) => r.data),
  });

  const funnel = stats?.funnel || MOCK_FUNNEL;
  const daily = stats?.daily_activity || [];
  const sources = sourcesData?.sources || MOCK_SOURCES;

  const pieData = funnel.map((f) => ({
    name: STAGE_CONFIG[f.stage as LeadStage]?.label || f.stage,
    value: f.count,
    color: STAGE_COLORS[f.stage],
  }));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Total Leads", val: stats?.total_leads ?? 847, color: "#60a5fa", bg: "rgba(59,130,246,0.12)" },
          { icon: TrendingUp, label: "Conversion Rate", val: `${stats?.conversion_rate ?? 19.4}%`, color: "#34d399", bg: "rgba(16,185,129,0.12)" },
          { icon: DollarSign, label: "Revenue Est.", val: `$${((stats?.estimated_revenue ?? 82000) / 1000).toFixed(0)}K`, color: "#a78bfa", bg: "rgba(139,92,246,0.12)" },
          { icon: Target, label: "Converted", val: stats?.converted_leads ?? 164, color: "#fb923c", bg: "rgba(251,146,60,0.12)" },
        ].map(({ icon: Icon, label, val, color, bg }, i) => (
          <motion.div
            key={label}
            className="stat-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "rgb(100 116 139)" }}>{label}</p>
                <p className="text-3xl font-bold text-white">{val}</p>
              </div>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon size={20} style={{ color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Activity Trend */}
        <div className="xl:col-span-3 glass-card p-5">
          <h3 className="font-semibold text-white mb-1">Activity Trend</h3>
          <p className="text-xs text-slate-500 mb-4">Leads added, messages sent & tasks completed</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={daily.length ? daily : Array.from({ length: 14 }, (_, i) => ({
              date: `Day ${i + 1}`, leads_added: Math.floor(Math.random() * 25) + 5,
              messages_sent: Math.floor(Math.random() * 50) + 20, tasks_completed: Math.floor(Math.random() * 12) + 2,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="leads_added" name="Leads" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="messages_sent" name="Messages" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="tasks_completed" name="Tasks" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie */}
        <div className="xl:col-span-2 glass-card p-5">
          <h3 className="font-semibold text-white mb-1">Stage Distribution</h3>
          <p className="text-xs text-slate-500 mb-4">Current pipeline breakdown</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {pieData.slice(0, 6).map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-slate-400 truncate">{d.name}</span>
                <span className="text-slate-300 ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Funnel Bar Chart */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-white mb-1">Lead Funnel Analysis</h3>
          <p className="text-xs text-slate-500 mb-4">Conversion at each stage</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={funnel} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="stage"
                tickFormatter={(v) => STAGE_CONFIG[v as LeadStage]?.label || v}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false} tickLine={false} width={110}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Leads" radius={[0, 4, 4, 0]}>
                {funnel.map((entry) => (
                  <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage] || "#8b5cf6"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Lead Sources */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-white mb-1">Lead Sources</h3>
          <p className="text-xs text-slate-500 mb-4">Where your leads are coming from</p>
          <div className="space-y-3">
            {sources.map((s: { source: string; count: number }, i: number) => {
              const total = sources.reduce((acc: number, x: { count: number }) => acc + x.count, 0);
              const pct = Math.round((s.count / total) * 100);
              return (
                <div key={s.source}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">{s.source}</span>
                    <span className="text-slate-400">{s.count} ({pct}%)</span>
                  </div>
                  <div className="score-bar">
                    <div className="score-bar-fill" style={{ width: `${pct}%`, background: SOURCE_COLORS[i % SOURCE_COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Counselor Leaderboard */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-white mb-4">Counselor Leaderboard</h3>
        <div className="space-y-3">
          {(stats?.counselor_performance || [
            { counselor_id: "1", counselor_name: "Sarah Johnson", leads_assigned: 142, leads_converted: 31, conversion_rate: 21.8, messages_sent: 486 },
            { counselor_id: "2", counselor_name: "Mike Chen", leads_assigned: 118, leads_converted: 24, conversion_rate: 20.3, messages_sent: 392 },
          ]).map((c, i) => (
            <div key={c.counselor_id} className="flex items-center gap-4 p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)" }}>
              <span className="text-lg font-bold text-slate-600 w-6 text-center">#{i + 1}</span>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", color: "white" }}>
                {c.counselor_name.split(" ").map((n: string) => n[0]).join("")}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{c.counselor_name}</p>
                <p className="text-xs text-slate-500">{c.leads_assigned} leads · {c.messages_sent} messages</p>
              </div>
              <div className="text-right">
                <p className={`font-bold text-sm ${c.conversion_rate >= 20 ? "text-emerald-400" : "text-yellow-400"}`}>
                  {c.conversion_rate}%
                </p>
                <p className="text-xs text-slate-500">conversion</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
