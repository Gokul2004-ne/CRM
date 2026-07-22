"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { Service } from "@/lib/types";
import { Plus, Pencil, Trash2, Search, IndianRupee, Calendar, RefreshCw } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

const recurrenceColors: Record<string, string> = {
  MONTHLY: "background:#EFF6FF;color:#1D4ED8",
  QUARTERLY: "background:#F0FDF4;color:#15803D",
  ANNUAL: "background:#FFF7ED;color:#C2410C",
  CUSTOM: "background:#F5F3FF;color:#7C3AED",
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
          <div className="search-wrapper">
            <Search className="search-icon" />
            <input className="search-input" placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Service</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Service Name</th>
              <th>Due Date</th>
              <th>Price</th>
              <th>Recurrence</th>
              <th>Applicable Months</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.id}>
                <td style={{ color: "#94A3B8", fontWeight: 600 }}>{i + 1}</td>
                <td style={{ fontWeight: 700, color: "#0F172A" }}>{s.name}</td>
                <td>{s.dueDate ? formatDate(s.dueDate) : "-"}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontWeight: 600, color: "#059669" }}>
                    <IndianRupee size={13} /> {formatCurrency(s.price).replace("₹", "")}
                  </div>
                </td>
                <td>
                  <span className="badge" style={{ ...(Object.fromEntries((recurrenceColors[s.recurrence] || "").split(";").map(p => p.split(":") as [string, string]))) }}>
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
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(s)}><Pencil size={13} /></button>
                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => setDeleteConfirm(s.id)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal.open && (
        <div className="modal-overlay" onClick={() => setModal({ open: false, editing: null })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modal.editing ? "Edit Service" : "Add Service"}</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal({ open: false, editing: null })}>✕</button>
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
                        className={`btn btn-sm ${selected ? "btn-primary" : "btn-secondary"}`}
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
              <button className="btn btn-secondary" onClick={() => setModal({ open: false, editing: null })}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>{modal.editing ? "Save Changes" : "Add Service"}</button>
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
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => { deleteService(deleteConfirm!); setDeleteConfirm(null); toast.success("Service deleted"); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
