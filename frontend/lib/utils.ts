import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { LeadStage, TaskPriority, TaskStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, fmt = "MMM d, yyyy"): string {
  return format(new Date(date), fmt);
}

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return `Today ${format(d, "h:mm a")}`;
  if (isYesterday(d)) return `Yesterday ${format(d, "h:mm a")}`;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

export const STAGE_CONFIG: Record<LeadStage, { label: string; color: string; bgColor: string; order: number }> = {
  new: { label: "New", color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/20", order: 0 },
  contacted: { label: "Contacted", color: "text-purple-400", bgColor: "bg-purple-500/10 border-purple-500/20", order: 1 },
  interested: { label: "Interested", color: "text-yellow-400", bgColor: "bg-yellow-500/10 border-yellow-500/20", order: 2 },
  documents_pending: { label: "Docs Pending", color: "text-orange-400", bgColor: "bg-orange-500/10 border-orange-500/20", order: 3 },
  applied: { label: "Applied", color: "text-cyan-400", bgColor: "bg-cyan-500/10 border-cyan-500/20", order: 4 },
  converted: { label: "Converted", color: "text-green-400", bgColor: "bg-green-500/10 border-green-500/20", order: 5 },
  lost: { label: "Lost", color: "text-red-400", bgColor: "bg-red-500/10 border-red-500/20", order: 6 },
};

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: "Low", color: "text-slate-400" },
  medium: { label: "Medium", color: "text-yellow-400" },
  high: { label: "High", color: "text-orange-400" },
  urgent: { label: "Urgent", color: "text-red-400" },
};

export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "text-yellow-400" },
  in_progress: { label: "In Progress", color: "text-blue-400" },
  done: { label: "Done", color: "text-green-400" },
  overdue: { label: "Overdue", color: "text-red-400" },
};

export function getScoreColor(score: number): string {
  if (score >= 75) return "text-green-400";
  if (score >= 50) return "text-yellow-400";
  if (score >= 25) return "text-orange-400";
  return "text-red-400";
}

export function getScoreBg(score: number): string {
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  if (score >= 25) return "bg-orange-500";
  return "bg-red-500";
}

export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.slice(0, length)}...` : str;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const LEAD_STAGES = Object.entries(STAGE_CONFIG)
  .sort(([, a], [, b]) => a.order - b.order)
  .map(([key, val]) => ({ value: key as LeadStage, label: val.label }));
