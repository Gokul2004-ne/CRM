"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { Service } from "@/lib/types";
import { Plus, Pencil, Trash2, Search, IndianRupee, RefreshCw } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

const recurrenceColors: Record<string, { bg: string; color: string }> = {
  MONTHLY: { bg: "#EFF6FF", color: "#1D4ED8" },
  QUARTERLY: { bg: "#F0FDF4", color: "#15803D" },
  ANNUAL: { bg: "#FFF7ED", color: "#C2410C" },
  CUSTOM: { bg: "#F5F3FF", color: "#7C3AED" },
};

const emptyService = (): Service => ({
  id: "", name: "", price: 0, recurrence: "ANNUAL", applicableMonths: [], dueDate: ""
});

export default function ServicesPage() {
  const { services, addService, updateService, deleteService } = useAppStore();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ open: boolean; editing: Service | null }>({ open: false, editing: null });
  const [form, setForm] = useState<Service>(emptyService());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = useMemo(() =>
    services.filter(s => s.name.toLowerCase().includes(search.toLowerCase())), [services, search]);

  const openAdd = () => { setForm(emptyService()); setModal({ open: true, editing: null }); };
  const openEdit = (s: Service) => { setForm({ ...s }); setModal({ open: true, editing: s }); };

  const handleSave = () => {
    if (!form.name) { toast.error("Service name is required"); return; }
    if (modal.editing) { updateService(form); toast.success("Service updated"); }
    else { addService({ ...form, id: `s${Date.now()}` }); toast.success("Service added"); }
    setModal({ open: false, editing: null });
  };

  return (
    <AppShell title="Services List" subtitle={`${services.length} services configured`}>
      <div className="data-table-wrapper">
        <div className="data-table-header">
          <div className="toolbar-controls">
            <div className="search-wrapper">
              <Search className="search-icon" />
              <input className="search-input" placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <button className="btn-slds btn-slds-primary" onClick={openAdd}><Plus size={15} /> Add Service</button>
        </div>

        <div className="table-scroll-container">
          <table>
            <thead>
              <tr>
                <th className="col-num">#</th>
                <th>Service Name</th>
                <th>Due Date</th>
                <th className="col-right">Price</th>
                <th>Recurrence</th>
                <th>Applicable Months</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const colors = recurrenceColors[s.recurrence] || { bg: "#F1F5F9", color: "#334155" };
                return (
                  <tr key={s.id}>
                    <td className="col-num">{i + 1}</td>
                    <td style={{ fontWeight: 700, color: "#0F172A" }}>{s.name}</td>
                    <td>{s.dueDate ? formatDate(s.dueDate) : "-"}</td>
                    <td className="col-right" style={{ fontWeight: 600, color: "#059669" }}>
                      {formatCurrency(s.price)}
                    </td>
                    <td>
                      <span className="badge" style={{ background: colors.bg, color: colors.color }}>
                        <RefreshCw size={10} style={{ marginRight: 4 }} />
                        {s.recurrence}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {s.applicableMonths.length === 12
                          ? <span className="chip">All Months</span>
                          : s.applicableMonths.map(m => (
                            <span key={m} className="chip">{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m-1]}</span>
                          ))
                        }
                      </div>
                    </td>
                    <td className="col-actions">
                      <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                        <button className="btn-slds btn-slds-secondary" style={{ padding: "5px 8px" }} onClick={() => openEdit(s)} title="Edit">
                          <Pencil size={13} />
                        </button>
                        <button className="btn-slds btn-slds-secondary" style={{ padding: "5px 8px", color: "#DC2626", borderColor: "#FCA5A5" }} onClick={() => setDeleteConfirm(s.id)} title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-table-cell">
                    No services found matching "{search}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal.open && (
        <div className="modal-overlay" onClick={() => setModal({ open: false, editing: null })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modal.editing ? "Edit Service" : "Add Service"}</div>
              <button className="btn-slds btn-slds-secondary" style={{ padding: "4px 8px" }} onClick={() => setModal({ open: false, editing: null })}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Service Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. GST Filing" />
              </div>
              <div className="form-grid-2">
                <div className="form-group"><label className="form-label">Due Date</label>
                  <input className="form-input" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
                <div className="form-group"><label className="form-label">Price (₹)</label>
                  <input className="form-input" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} placeholder="0" />
                </div>
                <div className="form-group"><label className="form-label">Recurrence</label>
                  <select className="form-select" value={form.recurrence} onChange={e => setForm(f => ({ ...f, recurrence: e.target.value as any }))}>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="ANNUAL">Annual</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Applicable Months</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                  {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => {
                    const monthNum = i + 1;
                    const selected = form.applicableMonths.includes(monthNum);
                    return (
                      <button key={m} type="button"
                        className={`btn-slds ${selected ? "btn-slds-primary" : "btn-slds-secondary"}`}
                        style={{ padding: "4px 10px", fontSize: 12 }}
                        onClick={() => setForm(f => ({
                          ...f,
                          applicableMonths: selected ? f.applicableMonths.filter(x => x !== monthNum) : [...f.applicableMonths, monthNum]
                        }))}
                      >{m}</button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-slds btn-slds-secondary" onClick={() => setModal({ open: false, editing: null })}>Cancel</button>
              <button className="btn-slds btn-slds-primary" onClick={handleSave}>{modal.editing ? "Save Changes" : "Add Service"}</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header"><div className="modal-title">Delete Service?</div></div>
            <div className="modal-body"><p style={{ color: "#64748B", fontSize: 14 }}>This will permanently delete this service. This action cannot be undone.</p></div>
            <div className="modal-footer">
              <button className="btn-slds btn-slds-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-slds btn-slds-primary" style={{ background: "#DC2626" }} onClick={() => { deleteService(deleteConfirm!); setDeleteConfirm(null); toast.success("Service deleted"); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
