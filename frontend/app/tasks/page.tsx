"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, CheckSquare, Clock, AlertTriangle, Calendar,
  Filter, X, Check, Trash2, ChevronRight, Flag
} from "lucide-react";
import toast from "react-hot-toast";
import { tasksApi } from "@/lib/api";
import { Task, TaskPriority, TaskStatus } from "@/types";
import { PRIORITY_CONFIG, TASK_STATUS_CONFIG, formatRelativeTime, formatDate } from "@/lib/utils";

const MOCK_TASKS: Task[] = [
  { id: "t1", title: "Follow up with Aisha about MBA documents", description: "She mentioned she needs more info on LBS", due_date: new Date(Date.now() - 86400000).toISOString(), status: "overdue", priority: "urgent", lead_id: "1", lead_name: "Aisha Rahman", assignee_name: "Sarah Johnson", organization_id: "demo", created_at: new Date().toISOString() },
  { id: "t2", title: "Send UK visa guide to Rahul Verma", due_date: new Date(Date.now() + 3600000).toISOString(), status: "pending", priority: "high", lead_id: "2", lead_name: "Rahul Verma", assignee_name: "Mike Chen", organization_id: "demo", created_at: new Date().toISOString() },
  { id: "t3", title: "Schedule counseling session - Fatima", due_date: new Date(Date.now() + 86400000).toISOString(), status: "pending", priority: "medium", lead_id: "3", lead_name: "Fatima Al-Sayed", assignee_name: "Priya Sharma", organization_id: "demo", created_at: new Date().toISOString() },
  { id: "t4", title: "Submit application for Chen Wei", due_date: new Date(Date.now() + 172800000).toISOString(), status: "in_progress", priority: "high", lead_id: "4", lead_name: "Chen Wei", organization_id: "demo", created_at: new Date().toISOString() },
  { id: "t5", title: "Review offer letter from University of Melbourne", due_date: new Date(Date.now() + 259200000).toISOString(), status: "pending", priority: "medium", organization_id: "demo", created_at: new Date().toISOString() },
  { id: "t6", title: "Update CRM pipeline for Q4 leads", due_date: new Date(Date.now() + 604800000).toISOString(), status: "pending", priority: "low", organization_id: "demo", created_at: new Date().toISOString() },
];

const PRIORITY_ICON_COLOR: Record<TaskPriority, string> = {
  urgent: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#64748b",
};

function TaskCard({ task, onComplete, onDelete }: {
  task: Task;
  onComplete: () => void;
  onDelete: () => void;
}) {
  const isOverdue = task.status === "overdue" || (task.status !== "done" && new Date(task.due_date) < new Date());
  const priorityConf = PRIORITY_CONFIG[task.priority];
  const statusConf = TASK_STATUS_CONFIG[task.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-start gap-3 p-4 rounded-xl transition-all group"
      style={{
        background: isOverdue ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${isOverdue ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}`,
      }}
    >
      {/* Complete button */}
      <button
        onClick={onComplete}
        className="mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
        style={{
          borderColor: task.status === "done" ? "#10b981" : "rgba(255,255,255,0.2)",
          background: task.status === "done" ? "#10b981" : "transparent",
        }}
      >
        {task.status === "done" && <Check size={10} className="text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`font-medium text-sm ${task.status === "done" ? "line-through text-slate-500" : "text-white"}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Flag size={12} style={{ color: PRIORITY_ICON_COLOR[task.priority] }} />
            <span className={`text-xs font-medium ${statusConf.color}`}>{statusConf.label}</span>
          </div>
        </div>

        {task.description && (
          <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
        )}

        <div className="flex items-center gap-3 mt-2">
          <div className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-400" : "text-slate-500"}`}>
            <Clock size={10} />
            {isOverdue && task.status !== "done" ? "Overdue: " : ""}{formatDate(task.due_date, "MMM d, h:mm a")}
          </div>
          {task.lead_name && (
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <ChevronRight size={10} />
              {task.lead_name}
            </div>
          )}
          {task.assignee_name && (
            <div className="text-xs text-slate-600">{task.assignee_name}</div>
          )}
        </div>
      </div>

      {/* Delete */}
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all mt-0.5">
        <Trash2 size={14} />
      </button>
    </motion.div>
  );
}

// ─── Add Task Modal ───────────────────────────────────────────────────────────────
function AddTaskModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", description: "", due_date: "", priority: "medium" as TaskPriority });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.due_date) return toast.error("Title and due date are required");
    setLoading(true);
    try {
      await tasksApi.create(form);
      toast.success("Task created!");
      qc.invalidateQueries({ queryKey: ["tasks"] });
      onClose();
    } catch { } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div className="modal-content p-6" onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-white">New Task</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Task Title *</label>
            <input className="input-field" placeholder="What needs to be done?" value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Description</label>
            <textarea className="input-field resize-none" rows={3} placeholder="Optional details..."
              value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Due Date *</label>
              <input type="datetime-local" className="input-field" value={form.due_date}
                onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Priority</label>
              <select className="input-field" value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as TaskPriority }))}>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function TasksPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["tasks", filter],
    queryFn: () => tasksApi.list({ status: filter === "all" ? undefined : filter }).then((r) => r.data),
    placeholderData: { items: MOCK_TASKS },
  });

  const tasks: Task[] = data?.items || MOCK_TASKS;

  const filteredTasks = filter === "all" ? tasks : tasks.filter((t) =>
    filter === "overdue" ? (t.status === "overdue" || (t.status !== "done" && new Date(t.due_date) < new Date())) : t.status === filter
  );

  const complete = useMutation({
    mutationFn: (id: string) => tasksApi.complete(id),
    onSuccess: () => { toast.success("Task completed! ✓"); qc.invalidateQueries({ queryKey: ["tasks"] }); },
  });

  const del = useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => { toast.success("Task deleted"); qc.invalidateQueries({ queryKey: ["tasks"] }); },
  });

  const overdueCount = tasks.filter((t) => t.status === "overdue" || (t.status !== "done" && new Date(t.due_date) < new Date())).length;
  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  const FILTERS = [
    { id: "all", label: "All", count: tasks.length },
    { id: "overdue", label: "Overdue", count: overdueCount },
    { id: "pending", label: "Pending", count: pendingCount },
    { id: "in_progress", label: "In Progress", count: tasks.filter((t) => t.status === "in_progress").length },
    { id: "done", label: "Done", count: doneCount },
  ];

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Overdue", count: overdueCount, icon: AlertTriangle, color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
          { label: "Pending", count: pendingCount, icon: Clock, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
          { label: "Completed", count: doneCount, icon: CheckSquare, color: "#10b981", bg: "rgba(16,185,129,0.1)" },
        ].map(({ label, count, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
              <Icon size={20} style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{count}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
              style={{
                background: filter === f.id ? "rgba(139,92,246,0.2)" : "transparent",
                color: filter === f.id ? "#a78bfa" : "rgb(148 163 184)",
              }}
            >
              {f.label}
              <span className="px-1.5 py-0.5 rounded-full text-xs"
                style={{ background: "rgba(255,255,255,0.08)" }}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary ml-auto">
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        <AnimatePresence>
          {filteredTasks.length > 0 ? filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={() => complete.mutate(task.id)}
              onDelete={() => del.mutate(task.id)}
            />
          )) : (
            <div className="text-center py-16 text-slate-600">
              <CheckSquare size={40} className="mx-auto mb-3 opacity-30" />
              <p>No tasks in this view</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showAddModal && <AddTaskModal onClose={() => setShowAddModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
