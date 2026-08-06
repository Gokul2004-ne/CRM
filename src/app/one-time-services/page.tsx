"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { OneTimeService, ProgressStatus } from "@/lib/types";
import { Plus, Pencil, Trash2, Search, Eye, Calendar, Clock, Circle, CheckCircle2, Layers } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const progressStatusConfig: Record<ProgressStatus, { label: string; color: string; bg: string; border: string }> = {
  "To-do": { label: "To-do", color: "#475569", bg: "#F1F5F9", border: "#CBD5E1" },
  "In-progress": { label: "In-progress", color: "#D97706", bg: "#FFFBEB", border: "#FCD34D" },
  "Completed": { label: "Completed", color: "#059669", bg: "#F0FDF4", border: "#6EE7B7" },
};

const emptyOts = (): Partial<OneTimeService> => ({
  id: "", clientName: "", serviceName: "", dueDate: "", progress: "To-do", notes: ""
});

export default function OneTimeServicesPage() {
  const { clients, oneTimeServices, addOneTimeService, updateOneTimeService, deleteOneTimeService } = useAppStore();

  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ open: boolean; editing: OneTimeService | null }>({ open: false, editing: null });
  const [viewModal, setViewModal] = useState<{ open: boolean; item: OneTimeService | null }>({ open: false, item: null });
  const [form, setForm] = useState<Partial<OneTimeService>>(emptyOts());

  // Clients sorted in Ascending order for selection dropdown
  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => a.name.localeCompare(b.name));
  }, [clients]);

  // Requirement:
  // 1.) Client Name: manually enter or select in ascending order.
  // 2.) Service: enter manually.
  // 3.) Due Date: optional. Services WITH due date appear at TOP (sorted by due date ascending). Services WITHOUT due date appear at BOTTOM.
  // 4.) Progress: To-do, In-progress, Completed (colors change based on progress).
  // 5.) Actions: Edit, Delete, View symbols.
  const filteredAndSorted = useMemo(() => {
    const list = (oneTimeServices || []).filter(ots => {
      const q = search.toLowerCase();
      return (ots.clientName || "").toLowerCase().includes(q) ||
             (ots.serviceName || "").toLowerCase().includes(q);
    });

    return list.sort((a, b) => {
      // Services WITH a due date come FIRST (sorted by due date ascending)
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      // Both without due date -> sort by Client Name ascending
      return (a.clientName || "").localeCompare(b.clientName || "");
    });
  }, [oneTimeServices, search]);

  const openAdd = () => { setForm(emptyOts()); setModal({ open: true, editing: null }); };
  const openEdit = (ots: OneTimeService) => { setForm({ ...ots }); setModal({ open: true, editing: ots }); };

  const handleSave = () => {
    if (!form.clientName?.trim()) {
      toast.error("Please enter or select a Client Name");
      return;
    }
    if (!form.serviceName?.trim()) {
      toast.error("Please enter a Service Name");
      return;
    }

    if (modal.editing) {
      updateOneTimeService({
        id: form.id || modal.editing.id,
        clientName: form.clientName.trim(),
        serviceName: form.serviceName.trim(),
        dueDate: form.dueDate || "",
        progress: form.progress || "To-do",
        notes: form.notes || "",
      });
      toast.success("One Time Service updated!");
    } else {
      const record: OneTimeService = {
        id: `ots_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        clientName: form.clientName.trim(),
        serviceName: form.serviceName.trim(),
        dueDate: form.dueDate || "",
        progress: form.progress || "To-do",
        notes: form.notes || "",
        createdAt: new Date().toISOString(),
      };
      addOneTimeService(record);
      toast.success("One Time Service created successfully!");
    }
    setModal({ open: false, editing: null });
  };

  const cycleProgress = (ots: OneTimeService) => {
    const order: ProgressStatus[] = ["To-do", "In-progress", "Completed"];
    const nextIndex = (order.indexOf(ots.progress) + 1) % order.length;
    const next = order[nextIndex];
    updateOneTimeService({ ...ots, progress: next });
    toast.success(`Progress set to "${next}"`);
  };

  return (
    <AppShell title="One Time Service" subtitle="Track and manage individual non-recurring services for clients">
      <div className="data-table-wrapper">
        <div className="data-table-header">
          <div className="toolbar-controls">
            <div className="search-wrapper" style={{ width: 300 }}>
              <Search className="search-icon" />
              <input
                className="search-input"
                placeholder="Search client or service..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <button className="btn-slds btn-slds-primary" style={{ background: "#6366F1", border: "none" }} onClick={openAdd}>
            <Plus size={15} /> Add One Time Service
          </button>
        </div>

        {/* ─── Table with exact requested columns in order ──────────────── */}
        {/* 1. Client Name | 2. Service | 3. Due Date | 4. Progress | 5. Actions */}
        <div className="table-scroll-container">
          <table>
            <thead>
              <tr>
                <th style={{ minWidth: 200 }}>Client Name</th>
                <th style={{ minWidth: 220 }}>Service</th>
                <th style={{ minWidth: 150 }}>Due Date</th>
                <th style={{ minWidth: 140 }}>Progress</th>
                <th className="col-actions" style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((ots) => {
                const cfg = progressStatusConfig[ots.progress || "To-do"];
                const hasDueDate = Boolean(ots.dueDate);

                return (
                  <tr
                    key={ots.id}
                    style={{
                      background: hasDueDate ? "#F8FAFC" : "#FFFFFF",
                      borderLeft: hasDueDate ? "4px solid #6366F1" : "4px solid #CBD5E1",
                    }}
                  >
                    {/* 1. Client Name */}
                    <td style={{ fontWeight: 800, color: "#0F172A", fontSize: 13.5 }}>
                      {ots.clientName}
                    </td>

                    {/* 2. Service */}
                    <td>
                      <span style={{ fontWeight: 700, color: "#4F46E5", background: "#EEF2FF", padding: "4px 10px", borderRadius: 8, fontSize: 12.5, display: "inline-block" }}>
                        {ots.serviceName}
                      </span>
                    </td>

                    {/* 3. Due Date (Optional: Services WITH due date at TOP, WITHOUT due date at BOTTOM) */}
                    <td>
                      {ots.dueDate ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Calendar size={14} color="#6366F1" />
                          <span style={{ fontWeight: 700, color: "#0F172A", fontSize: 13 }}>
                            {formatDate(ots.dueDate)}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>
                          No due date
                        </span>
                      )}
                    </td>

                    {/* 4. Progress: To-do, In-progress, Completed (Dynamic colors) */}
                    <td>
                      <button
                        onClick={() => cycleProgress(ots)}
                        title="Click to cycle progress status"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "4px 12px", background: cfg.bg, border: `1px solid ${cfg.border}`,
                          borderRadius: 20, cursor: "pointer", transition: "all 0.15s",
                        }}
                      >
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.color }} />
                        <span style={{ fontSize: 12, fontWeight: 800, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </button>
                    </td>

                    {/* 5. Actions: Edit, Delete, View symbols */}
                    <td className="col-actions">
                      <div style={{ display: "flex", gap: 4 }}>
                        {/* View Symbol (👁️) */}
                        <button className="icon-btn-slds" title="View Service" onClick={() => setViewModal({ open: true, item: ots })}>
                          <Eye size={15} color="#0176D3" />
                        </button>
                        {/* Edit Symbol (✏️) */}
                        <button className="icon-btn-slds" title="Edit Service" onClick={() => openEdit(ots)}>
                          <Pencil size={15} color="#64748B" />
                        </button>
                        {/* Delete Symbol (🗑️) */}
                        <button
                          className="icon-btn-slds"
                          title="Delete Service"
                          onClick={() => {
                            if (confirm(`Delete one-time service "${ots.serviceName}" for ${ots.clientName}?`)) {
                              deleteOneTimeService(ots.id);
                              toast.success("One Time Service deleted!");
                            }
                          }}
                        >
                          <Trash2 size={15} color="#DC2626" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredAndSorted.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 45, color: "#64748B" }}>
                    No one-time services added yet. Click "+ Add One Time Service" to add your first task!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL: Add / Edit One Time Service ─────────────────────────── */}
      {modal.open && (
        <div className="modal-overlay" onClick={() => setModal({ open: false, editing: null })}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: "#6366F1", color: "white" }}>
              <div className="modal-title">{modal.editing ? "Edit One Time Service" : "Add One Time Service"}</div>
              <button className="btn-slds btn-slds-secondary" style={{ padding: "4px 8px", background: "rgba(255,255,255,0.2)", color: "white" }} onClick={() => setModal({ open: false, editing: null })}>✕</button>
            </div>
            <div className="modal-body" style={{ display: "grid", gap: 14, padding: 24 }}>

              {/* 1. Client Name (Enter manually OR Select from ascending list) */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>1. Client Name *</label>
                <input
                  className="form-input"
                  placeholder="Type Client Name or select below..."
                  value={form.clientName || ""}
                  onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                  style={{ marginBottom: 6 }}
                />
                <select
                  className="form-select"
                  value={form.clientName || ""}
                  onChange={e => e.target.value && setForm(f => ({ ...f, clientName: e.target.value }))}
                >
                  <option value="">-- Select from existing clients (Ascending) --</option>
                  {sortedClients.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* 2. Service Name (Manual Entry) */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>2. Service Name *</label>
                <input
                  className="form-input"
                  placeholder="e.g. GST Registration / Trademark Filing / Company Setup"
                  value={form.serviceName || ""}
                  onChange={e => setForm(f => ({ ...f, serviceName: e.target.value }))}
                />
              </div>

              {/* 3. Due Date (Optional) */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>3. Due Date (Optional)</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.dueDate || ""}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                />
                <p style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
                  Services with a due date automatically display at the top of the list!
                </p>
              </div>

              {/* 4. Progress (To-do, In-progress, Completed) */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>4. Progress Status</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["To-do", "In-progress", "Completed"] as ProgressStatus[]).map(p => {
                    const cfg = progressStatusConfig[p];
                    const isSelected = form.progress === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, progress: p }))}
                        style={{
                          flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer",
                          fontSize: 12.5, fontWeight: 800,
                          background: isSelected ? cfg.bg : "#F8FAFC",
                          color: isSelected ? cfg.color : "#64748B",
                          border: isSelected ? `2px solid ${cfg.color}` : "1px solid #CBD5E1",
                          transition: "all 0.15s",
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="modal-footer">
              <button className="btn-slds btn-slds-secondary" onClick={() => setModal({ open: false, editing: null })}>Cancel</button>
              <button className="btn-slds btn-slds-primary" style={{ background: "#6366F1", border: "none" }} onClick={handleSave}>
                {modal.editing ? "Save Changes" : "Create One Time Service"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: View Details ────────────────────────────────────────── */}
      {viewModal.open && viewModal.item && (
        <div className="modal-overlay" onClick={() => setViewModal({ open: false, item: null })}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: "#6366F1", color: "white" }}>
              <div className="modal-title">One Time Service Details</div>
              <button className="btn-slds btn-slds-secondary" style={{ padding: "4px 8px", background: "rgba(255,255,255,0.2)", color: "white" }} onClick={() => setViewModal({ open: false, item: null })}>✕</button>
            </div>
            <div className="modal-body" style={{ display: "grid", gap: 16, padding: 24 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Client Name</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#0F172A", marginTop: 2 }}>{viewModal.item.clientName}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Service</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#4F46E5", marginTop: 2 }}>{viewModal.item.serviceName}</div>
              </div>
              <div style={{ display: "flex", gap: 20 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Due Date</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: viewModal.item.dueDate ? "#0F172A" : "#94A3B8", marginTop: 2 }}>
                    {viewModal.item.dueDate ? formatDate(viewModal.item.dueDate) : "No due date set"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Progress Status</div>
                  <div style={{ marginTop: 4 }}>
                    {(() => {
                      const cfg = progressStatusConfig[viewModal.item.progress || "To-do"];
                      return (
                        <span style={{ padding: "4px 12px", background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                          {cfg.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-slds btn-slds-secondary" onClick={() => setViewModal({ open: false, item: null })}>Close</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
