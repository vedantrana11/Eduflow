"use client";
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Filter, Search, LayoutGrid, List, Phone,
  Mail, MapPin, Star, Clock, ChevronRight, X, Edit2,
  Trash2, MessageSquare, User, Calendar
} from "lucide-react";
import toast from "react-hot-toast";
import { leadsApi } from "@/lib/api";
import { Lead, LeadStage, LeadFormData } from "@/types";
import { STAGE_CONFIG, LEAD_STAGES, formatRelativeTime, getScoreColor, getScoreBg, truncate, cn } from "@/lib/utils";

// ─── Mock Data ────────────────────────────────────────────────────────────────────
const MOCK_LEADS: Lead[] = [
  { id: "1", name: "Aisha Rahman", phone: "+1234567890", email: "aisha@example.com", country_interest: "UK", course_interest: "MBA", stage: "interested", score: 72, counselor_name: "Sarah J.", source: "website", tags: ["hot"], notes: [], follow_up_date: new Date(Date.now() + 86400000).toISOString(), organization_id: "demo", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "2", name: "Rahul Verma", phone: "+9876543210", email: "rahul@example.com", country_interest: "Canada", course_interest: "Computer Science", stage: "documents_pending", score: 85, counselor_name: "Mike C.", source: "referral", tags: ["urgent"], notes: [], organization_id: "demo", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "3", name: "Fatima Al-Sayed", phone: "+5551234567", email: "fatima@example.com", country_interest: "Australia", course_interest: "Nursing", stage: "applied", score: 91, counselor_name: "Priya S.", source: "instagram", tags: [], notes: [], organization_id: "demo", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "4", name: "Chen Wei", phone: "+8612345678", email: "chenwei@example.com", country_interest: "USA", course_interest: "Data Science", stage: "new", score: 35, source: "website", tags: [], notes: [], organization_id: "demo", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "5", name: "Pradeep Kumar", phone: "+917891234567", email: "pradeep@example.com", country_interest: "Germany", course_interest: "Engineering", stage: "contacted", score: 48, counselor_name: "James W.", source: "facebook", tags: [], notes: [], organization_id: "demo", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "6", name: "Sofia Martinez", phone: "+525551234567", email: "sofia@example.com", country_interest: "UK", course_interest: "Law", stage: "converted", score: 98, counselor_name: "Sarah J.", source: "referral", tags: ["vip"], notes: [], organization_id: "demo", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

// ─── Lead Card (Kanban) ───────────────────────────────────────────────────────────
function LeadCard({ lead, onClick, onDragStart }: { lead: Lead; onClick: () => void; onDragStart?: (e: React.DragEvent) => void }) {
  return (
    <motion.div
      layout
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="kanban-card"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <p className="font-semibold text-white text-sm leading-tight">{lead.name}</p>
        <span className={`text-xs font-bold ml-2 flex-shrink-0 ${getScoreColor(lead.score)}`}>
          {lead.score}
        </span>
      </div>

      <div className="space-y-1.5 mb-3">
        {lead.phone && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Phone size={10} /> {lead.phone}
          </div>
        )}
        {lead.course_interest && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin size={10} /> {lead.country_interest} · {lead.course_interest}
          </div>
        )}
        {lead.follow_up_date && (
          <div className="flex items-center gap-1.5 text-xs text-orange-400">
            <Clock size={10} /> Follow-up: {formatRelativeTime(lead.follow_up_date)}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="score-bar flex-1 mr-3">
          <div className="score-bar-fill" style={{ width: `${lead.score}%`, background: getScoreBg(lead.score) }} />
        </div>
        {lead.counselor_name && (
          <span className="text-xs text-slate-500">{lead.counselor_name.split(" ")[0]}</span>
        )}
      </div>

      {lead.tags && lead.tags.length > 0 && (
        <div className="flex gap-1 mt-2">
          {lead.tags.map((tag) => (
            <span key={tag} className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Lead Drawer ─────────────────────────────────────────────────────────────────
function LeadDrawer({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const [note, setNote] = useState("");
  const qc = useQueryClient();
  const stageConfig = STAGE_CONFIG[lead.stage];

  const addNote = useMutation({
    mutationFn: () => leadsApi.addNote(lead.id, note),
    onSuccess: () => {
      toast.success("Note added");
      setNote("");
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <motion.div
        className="drawer"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div>
            <h2 className="font-bold text-lg text-white">{lead.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`badge ${stageConfig?.bgColor} ${stageConfig?.color}`}>
                {stageConfig?.label}
              </span>
              <span className={`text-sm font-bold ${getScoreColor(lead.score)}`}>Score: {lead.score}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white"
            style={{ background: "rgba(255,255,255,0.06)" }}>
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Contact info */}
          <div className="glass-card p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Contact Info</h3>
            {[
              { icon: Phone, val: lead.phone },
              { icon: Mail, val: lead.email },
              { icon: MapPin, val: lead.country_interest ? `${lead.country_interest} · ${lead.course_interest}` : undefined },
              { icon: User, val: lead.counselor_name ? `Counselor: ${lead.counselor_name}` : undefined },
            ].filter((i) => i.val).map(({ icon: Icon, val }) => (
              <div key={val} className="flex items-center gap-2.5 text-sm text-slate-300">
                <Icon size={14} className="text-slate-500 flex-shrink-0" />
                {val}
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="flex gap-2">
            <a href={`tel:${lead.phone}`} className="flex-1 btn-secondary justify-center text-xs py-2">
              <Phone size={13} /> Call
            </a>
            <a href={`/whatsapp?lead=${lead.id}`} className="flex-1 btn-secondary justify-center text-xs py-2">
              <MessageSquare size={13} /> WhatsApp
            </a>
            <a href={`mailto:${lead.email}`} className="flex-1 btn-secondary justify-center text-xs py-2">
              <Mail size={13} /> Email
            </a>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Notes</h3>
            {lead.notes?.length > 0 ? (
              <div className="space-y-2 mb-3">
                {lead.notes.slice(-3).map((n, i) => (
                  <div key={i} className="glass-card p-3">
                    <p className="text-sm text-slate-300">{n.content}</p>
                    <p className="text-xs text-slate-600 mt-1">{n.creator_name} · {formatRelativeTime(n.created_at)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-600 mb-3">No notes yet</p>
            )}
            <div className="flex gap-2">
              <input
                className="input-field flex-1 text-xs"
                placeholder="Add a note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && note && addNote.mutate()}
              />
              <button onClick={() => note && addNote.mutate()} className="btn-primary text-xs px-3 py-2">
                Add
              </button>
            </div>
          </div>

          {/* Stage update */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Update Stage</h3>
            <div className="grid grid-cols-2 gap-2">
              {LEAD_STAGES.map((s) => (
                <button
                  key={s.value}
                  className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${lead.stage === s.value ? "ring-1 ring-violet-400" : ""}`}
                  style={{
                    background: lead.stage === s.value ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.05)",
                    color: lead.stage === s.value ? "#a78bfa" : "rgb(148 163 184)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Add Lead Modal ───────────────────────────────────────────────────────────────
function AddLeadModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<LeadFormData>>({ stage: "new", tags: [] });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return toast.error("Name and phone are required");
    setLoading(true);
    try {
      await leadsApi.create(form);
      toast.success("Lead added successfully!");
      qc.invalidateQueries({ queryKey: ["leads"] });
      onClose();
    } catch { } finally { setLoading(false); }
  };

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div className="modal-content p-6" onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-white">Add New Lead</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs text-slate-400 mb-1">Full Name *</label>
            <input className="input-field" placeholder="Student name" onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Phone *</label>
            <input className="input-field" placeholder="+1234567890" onChange={(e) => set("phone", e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Email</label>
            <input type="email" className="input-field" placeholder="email@example.com" onChange={(e) => set("email", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Country Interest</label>
            <input className="input-field" placeholder="UK, Canada, Australia..." onChange={(e) => set("country_interest", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Course Interest</label>
            <input className="input-field" placeholder="MBA, Engineering..." onChange={(e) => set("course_interest", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Stage</label>
            <select className="input-field" onChange={(e) => set("stage", e.target.value)} defaultValue="new">
              {LEAD_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Source</label>
            <select className="input-field" onChange={(e) => set("source", e.target.value)}>
              {["website", "referral", "instagram", "facebook", "google", "walk-in", "other"].map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? "Adding..." : "Add Lead"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────────
export default function LeadsPage() {
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("");
  const qc = useQueryClient();

  const updateStage = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => leadsApi.update(id, { stage }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });

  const handleDrop = (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    if (leadId) updateStage.mutate({ id: leadId, stage: newStage });
  };

  const { data } = useQuery({
    queryKey: ["leads", { search, stage: stageFilter }],
    queryFn: () => leadsApi.list({ search, stage: stageFilter, page_size: 100 }).then((r) => r.data),
    placeholderData: { items: MOCK_LEADS },
  });

  const leads: Lead[] = data?.items || MOCK_LEADS;

  // Group by stage for Kanban
  const grouped = LEAD_STAGES.reduce<Record<string, Lead[]>>((acc, s) => {
    acc[s.value] = leads.filter((l) => l.stage === s.value);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input-field pl-8"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="input-field w-auto"
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
        >
          <option value="">All Stages</option>
          {LEAD_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        {/* View toggle */}
        <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          {[{ id: "kanban", Icon: LayoutGrid }, { id: "table", Icon: List }].map(({ id, Icon }) => (
            <button
              key={id}
              onClick={() => setView(id as "kanban" | "table")}
              className="px-3 py-2 transition-all"
              style={{
                background: view === id ? "rgba(139,92,246,0.2)" : "transparent",
                color: view === id ? "#a78bfa" : "rgb(148 163 184)",
              }}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn-primary ml-auto">
          <Plus size={16} /> Add Lead
        </button>
      </div>

      {/* ── Kanban View ── */}
      {view === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "60vh" }}>
          {LEAD_STAGES.filter((s) => s.value !== "lost").map((stage) => {
            const stageLeads = grouped[stage.value] || [];
            const config = STAGE_CONFIG[stage.value as LeadStage];
            return (
              <div 
                key={stage.value} 
                className="kanban-column flex-shrink-0"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, stage.value)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full inline-block`}
                      style={{ background: config?.color.replace("text-", "").includes("-") ? undefined : config?.color }} />
                    <span className="text-xs font-semibold text-slate-300">{stage.label}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.07)", color: "rgb(148 163 184)" }}>
                    {stageLeads.length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  <AnimatePresence>
                    {stageLeads.map((lead) => (
                      <LeadCard 
                        key={lead.id} 
                        lead={lead} 
                        onClick={() => setSelectedLead(lead)} 
                        onDragStart={(e) => e.dataTransfer.setData("leadId", lead.id)}
                      />
                    ))}
                  </AnimatePresence>
                  {stageLeads.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-600">No leads</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Table View ── */}
      {view === "table" && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {["Name", "Phone", "Interest", "Stage", "Score", "Counselor", "Follow-up", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: "rgb(100 116 139)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, i) => {
                  const config = STAGE_CONFIG[lead.stage];
                  return (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="px-4 py-3 font-medium text-white">{lead.name}</td>
                      <td className="px-4 py-3 text-slate-400">{lead.phone}</td>
                      <td className="px-4 py-3 text-slate-400">{lead.country_interest} · {lead.course_interest}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${config?.bgColor} ${config?.color}`}>{config?.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${getScoreColor(lead.score)}`}>{lead.score}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{lead.counselor_name || "—"}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {lead.follow_up_date ? formatRelativeTime(lead.follow_up_date) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight size={14} className="text-slate-600" />
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lead Drawer */}
      <AnimatePresence>
        {selectedLead && <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} />}
      </AnimatePresence>

      {/* Add Lead Modal */}
      <AnimatePresence>
        {showAddModal && <AddLeadModal onClose={() => setShowAddModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
