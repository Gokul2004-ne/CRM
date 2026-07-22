"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { SubService } from "@/lib/types";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const empty = (): SubService => ({ id: "", serviceId: "", name: "", dueDate: "" });

export default function SubServicesPage() {
  const { services, subServices, addSubService, updateSubService, deleteSubService } = useAppStore();
  const [search, setSearch] = useState("");
  const [filterService, setFilterService] = useState("all");
  const [modal, setModal] = useState<{ open: boolean; editing: SubService | null }>({ open: false, editing: null });
  const [form, setForm] = useState<SubService>(empty());

  const filtered = useMemo(() =>
    subServices.filter(ss =>
      (filterService === "all" || ss.serviceId === filterService) &&
      ss.name.toLowerCase().includes(search.toLowerCase())
    ), [subServices, search, filterService]);

  const openAdd = () => { setForm(empty()); setModal({ open: true, editing: null }); };
  const openEdit = (ss: SubService) => { setForm({ ...ss }); setModal({ open: true, editing: ss }); };

  const handleSave = () => {
    if (!form.name || !form.serviceId) { toast.error("Service and sub-service name are required"); return; }
    if (modal.editing) { updateSubService(form); toast.success("Sub-service updated"); }
    else { addSubService({ ...form, id: `ss${Date.now()}` }); toast.success("Sub-service added"); }
    setModal({ open: false, editing: null });
  };

  return (
    <AppShell title="Sub Services" subtitle={`${subServices.length} sub-services configured`}>
      <div className="data-table-wrapper">
        <div className="data-table-header">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div className="search-wrapper">
              <Search className="search-icon" />
              <input className="search-input" placeholder="Search sub-services..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="fy-selector" value={filterService} onChange={e => setFilterService(e.target.value)}>
              <option value="all">All Services</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Sub Service</button>
        </div>
        <table>
          <thead>
            <tr><th>#</th><th>Main Service</th><th>Sub Service Name</th><th>Due Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map((ss, i) => {
              const parentService = services.find(s => s.id === ss.serviceId);
              return (
                <tr key={ss.id}>
                  <td style={{ color: "#94A3B8", fontWeight: 600 }}>{i + 1}</td>
                  <td>
                    <span className="chip" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>{parentService?.name || "-"}</span>
                  </td>
                  <td style={{ fontWeight: 600, color: "#0F172A" }}>{ss.name}</td>
                  <td>{ss.dueDate ? formatDate(ss.dueDate) : "-"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(ss)}><Pencil size={13} /></button>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => { deleteSubService(ss.id); toast.success("Deleted"); }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal.open && (
        <div className="modal-overlay" onClick={() => setModal({ open: false, editing: null })}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modal.editing ? "Edit Sub Service" : "Add Sub Service"}</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal({ open: false, editing: null })}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Main Service *</label>
                <select className="form-select" value={form.serviceId} onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))}>
                  <option value="">Select a service</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Sub Service Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. GSTR-1" />
              </div>
              <div className="form-group"><label className="form-label">Due Date</label>
                <input className="form-input" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal({ open: false, editing: null })}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>{modal.editing ? "Save" : "Add"}</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
