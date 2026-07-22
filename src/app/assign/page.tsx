"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { AssignedService } from "@/lib/types";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { formatCurrency, formatDate, getCurrentFY, getFYOptions } from "@/lib/utils";
import { toast } from "sonner";

const empty = (): Omit<AssignedService, "amountPending"> & { amountPending?: number } => ({
  id: "", clientId: "", serviceId: "", subServiceIds: [],
  financialYear: getCurrentFY(), amountBilled: 0, amountReceived: 0, dueDate: ""
});

export default function AssignPage() {
  const { clients, services, subServices, assignedServices, selectedFY, addAssignedService, updateAssignedService, deleteAssignedService } = useAppStore();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ open: boolean; editing: AssignedService | null }>({ open: false, editing: null });
  const [form, setForm] = useState<any>(empty());

  const filtered = useMemo(() => {
    return assignedServices
      .filter(a => a.financialYear === selectedFY)
      .filter(a => {
        const client = clients.find(c => c.id === a.clientId);
        const service = services.find(s => s.id === a.serviceId);
        return (client?.name || "").toLowerCase().includes(search.toLowerCase()) ||
               (service?.name || "").toLowerCase().includes(search.toLowerCase());
      });
  }, [assignedServices, clients, services, search, selectedFY]);

  const openAdd = () => { setForm(empty()); setModal({ open: true, editing: null }); };
  const openEdit = (a: AssignedService) => { setForm({ ...a }); setModal({ open: true, editing: a }); };

  const pending = (form.amountBilled || 0) - (form.amountReceived || 0);

  const availableSubServices = useMemo(() =>
    subServices.filter(ss => ss.serviceId === form.serviceId), [subServices, form.serviceId]);

  const handleSave = () => {
    if (!form.clientId || !form.serviceId) { toast.error("Client and service are required"); return; }
    const record: AssignedService = { ...form, amountPending: pending, id: form.id || `as${Date.now()}` };
    if (modal.editing) { updateAssignedService(record); toast.success("Updated successfully"); }
    else { addAssignedService(record); toast.success("Service assigned successfully"); }
    setModal({ open: false, editing: null });
  };

  const toggleSubService = (id: string) => {
    setForm((f: any) => ({
      ...f,
      subServiceIds: f.subServiceIds.includes(id)
        ? f.subServiceIds.filter((x: string) => x !== id)
        : [...f.subServiceIds, id]
    }));
  };

  const fyOptions = getFYOptions();

  return (
    <AppShell title="Assign Services" subtitle={`Assigned services & billing for FY ${selectedFY}`}>
      <div className="data-table-wrapper">
        <div className="data-table-header">
          <div className="toolbar-controls">
            <div className="search-wrapper">
              <Search className="search-icon" />
              <input className="search-input" placeholder="Search client or service..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <button className="btn-slds btn-slds-primary" onClick={openAdd}><Plus size={15} /> Assign Service</button>
        </div>

        <div className="table-scroll-container">
          <table>
            <thead>
              <tr>
                <th className="col-num">#</th>
                <th>Client</th>
                <th>Service</th>
                <th>Sub Services</th>
                <th>FY</th>
                <th className="col-right">Amount Billed</th>
                <th className="col-right">Amount Received</th>
                <th className="col-right">Amount Pending</th>
                <th>Due Date</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const client = clients.find(c => c.id === a.clientId);
                const service = services.find(s => s.id === a.serviceId);
                const subs = subServices.filter(ss => a.subServiceIds.includes(ss.id));
                return (
                  <tr key={a.id}>
                    <td className="col-num">{i + 1}</td>
                    <td style={{ fontWeight: 700, color: "#0F172A" }}>{client?.name || "-"}</td>
                    <td>{service?.name || "-"}</td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {subs.map(ss => <span key={ss.id} className="chip">{ss.name}</span>)}
                      </div>
                    </td>
                    <td><span className="badge" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>{a.financialYear}</span></td>
                    <td className="col-right" style={{ fontWeight: 600, color: "#059669" }}>{formatCurrency(a.amountBilled)}</td>
                    <td className="col-right" style={{ fontWeight: 600, color: "#D97706" }}>{formatCurrency(a.amountReceived)}</td>
                    <td className="col-right">
                      <span style={{ fontWeight: 700, color: a.amountPending > 0 ? "#DC2626" : "#059669" }}>
                        {formatCurrency(a.amountPending)}
                      </span>
                    </td>
                    <td>{a.dueDate ? formatDate(a.dueDate) : "-"}</td>
                    <td className="col-actions">
                      <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                        <button className="btn-slds btn-slds-secondary" style={{ padding: "5px 8px" }} onClick={() => openEdit(a)} title="Edit">
                          <Pencil size={13} />
                        </button>
                        <button className="btn-slds btn-slds-secondary" style={{ padding: "5px 8px", color: "#DC2626", borderColor: "#FCA5A5" }} onClick={() => { deleteAssignedService(a.id); toast.success("Removed"); }} title="Remove">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="empty-table-cell">
                    No assigned services for FY {selectedFY}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Row */}
        {filtered.length > 0 && (
          <div style={{ padding: "14px 20px", background: "#F8FAFC", borderTop: "2px solid #E2E8F0", display: "flex", gap: 24, justifyContent: "flex-end" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>Total Billed: {formatCurrency(filtered.reduce((s, a) => s + a.amountBilled, 0))}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#D97706" }}>Total Received: {formatCurrency(filtered.reduce((s, a) => s + a.amountReceived, 0))}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#DC2626" }}>Total Pending: {formatCurrency(filtered.reduce((s, a) => s + a.amountPending, 0))}</div>
          </div>
        )}
      </div>

      {modal.open && (
        <div className="modal-overlay" onClick={() => setModal({ open: false, editing: null })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modal.editing ? "Edit Assignment" : "Assign Service to Client"}</div>
              <button className="btn-slds btn-slds-secondary" style={{ padding: "4px 8px" }} onClick={() => setModal({ open: false, editing: null })}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid-2">
                <div className="form-group"><label className="form-label">Client *</label>
                  <select className="form-select" value={form.clientId} onChange={e => setForm((f: any) => ({ ...f, clientId: e.target.value }))}>
                    <option value="">Select client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Service *</label>
                  <select className="form-select" value={form.serviceId} onChange={e => setForm((f: any) => ({ ...f, serviceId: e.target.value, subServiceIds: [] }))}>
                    <option value="">Select service</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Financial Year</label>
                  <select className="form-select" value={form.financialYear} onChange={e => setForm((f: any) => ({ ...f, financialYear: e.target.value }))}>
                    {fyOptions.map(fy => <option key={fy} value={fy}>FY {fy}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Due Date</label>
                  <input className="form-input" type="date" value={form.dueDate} onChange={e => setForm((f: any) => ({ ...f, dueDate: e.target.value }))} />
                </div>
              </div>
              {availableSubServices.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Sub Services</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                    {availableSubServices.map(ss => (
                      <button key={ss.id} type="button"
                        className={`btn-slds ${form.subServiceIds.includes(ss.id) ? "btn-slds-primary" : "btn-slds-secondary"}`}
                        style={{ padding: "4px 10px", fontSize: 12 }}
                        onClick={() => toggleSubService(ss.id)}
                      >{ss.name}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="form-grid-2">
                <div className="form-group"><label className="form-label">Amount Billed (₹)</label>
                  <input className="form-input" type="number" value={form.amountBilled} onChange={e => setForm((f: any) => ({ ...f, amountBilled: Number(e.target.value) }))} />
                </div>
                <div className="form-group"><label className="form-label">Amount Received (₹)</label>
                  <input className="form-input" type="number" value={form.amountReceived} onChange={e => setForm((f: any) => ({ ...f, amountReceived: Number(e.target.value) }))} />
                </div>
              </div>
              <div style={{ padding: "12px 16px", background: pending > 0 ? "#FEF2F2" : "#F0FDF4", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, color: "#374151", fontSize: 14 }}>Amount Pending (Auto)</span>
                <span style={{ fontWeight: 800, fontSize: 20, color: pending > 0 ? "#DC2626" : "#059669" }}>{formatCurrency(pending)}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-slds btn-slds-secondary" onClick={() => setModal({ open: false, editing: null })}>Cancel</button>
              <button className="btn-slds btn-slds-primary" onClick={handleSave}>{modal.editing ? "Save Changes" : "Assign"}</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
