"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { RequiredDoc } from "@/lib/types";
import { Plus, Pencil, Trash2, Search, CheckCircle, Circle } from "lucide-react";
import { toast } from "sonner";

const empty = (): RequiredDoc => ({ id: "", subServiceId: "", name: "", isMandatory: true });

export default function RequiredDocsPage() {
  const { services, subServices, requiredDocs, addRequiredDoc, updateRequiredDoc, deleteRequiredDoc } = useAppStore();
  const [search, setSearch] = useState("");
  const [filterSS, setFilterSS] = useState("all");
  const [modal, setModal] = useState<{ open: boolean; editing: RequiredDoc | null }>({ open: false, editing: null });
  const [form, setForm] = useState<RequiredDoc>(empty());

  const filtered = useMemo(() =>
    requiredDocs.filter(d =>
      (filterSS === "all" || d.subServiceId === filterSS) &&
      d.name.toLowerCase().includes(search.toLowerCase())
    ), [requiredDocs, search, filterSS]);

  const openAdd = () => { setForm(empty()); setModal({ open: true, editing: null }); };
  const openEdit = (d: RequiredDoc) => { setForm({ ...d }); setModal({ open: true, editing: d }); };

  const handleSave = () => {
    if (!form.name || !form.subServiceId) { toast.error("Sub-service and document name are required"); return; }
    if (modal.editing) { updateRequiredDoc(form); toast.success("Document updated"); }
    else { addRequiredDoc({ ...form, id: `d${Date.now()}` }); toast.success("Document added"); }
    setModal({ open: false, editing: null });
  };

  const getSSInfo = (ssId: string) => {
    const ss = subServices.find(s => s.id === ssId);
    const svc = services.find(s => s.id === ss?.serviceId);
    return { ss, svc };
  };

  return (
    <AppShell title="Required Documents" subtitle={`${requiredDocs.length} documents configured`}>
      <div className="data-table-wrapper">
        <div className="data-table-header">
          <div className="toolbar-controls">
            <div className="search-wrapper">
              <Search className="search-icon" />
              <input className="search-input" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="fy-selector" value={filterSS} onChange={e => setFilterSS(e.target.value)}>
              <option value="all">All Sub Services</option>
              {subServices.map(ss => <option key={ss.id} value={ss.id}>{ss.name}</option>)}
            </select>
          </div>
          <button className="btn-slds btn-slds-primary" onClick={openAdd}><Plus size={15} /> Add Document</button>
        </div>

        <div className="table-scroll-container">
          <table>
            <thead>
              <tr>
                <th className="col-num">#</th>
                <th>Main Service</th>
                <th>Sub Service</th>
                <th>Document Name</th>
                <th>Mandatory</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => {
                const { ss, svc } = getSSInfo(d.subServiceId);
                return (
                  <tr key={d.id}>
                    <td className="col-num">{i + 1}</td>
                    <td><span className="chip" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>{svc?.name || "-"}</span></td>
                    <td><span className="chip" style={{ background: "#F0FDF4", color: "#15803D" }}>{ss?.name || "-"}</span></td>
                    <td style={{ fontWeight: 600, color: "#0F172A" }}>{d.name}</td>
                    <td>
                      {d.isMandatory
                        ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#DC2626", fontWeight: 600, fontSize: 13 }}><CheckCircle size={15} /> Mandatory</span>
                        : <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#94A3B8", fontSize: 13 }}><Circle size={15} /> Optional</span>
                      }
                    </td>
                    <td className="col-actions">
                      <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                        <button className="btn-slds btn-slds-secondary" style={{ padding: "5px 8px" }} onClick={() => openEdit(d)} title="Edit">
                          <Pencil size={13} />
                        </button>
                        <button className="btn-slds btn-slds-secondary" style={{ padding: "5px 8px", color: "#DC2626", borderColor: "#FCA5A5" }} onClick={() => { deleteRequiredDoc(d.id); toast.success("Deleted"); }} title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-table-cell">
                    No documents found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal.open && (
        <div className="modal-overlay" onClick={() => setModal({ open: false, editing: null })}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modal.editing ? "Edit Document" : "Add Required Document"}</div>
              <button className="btn-slds btn-slds-secondary" style={{ padding: "4px 8px" }} onClick={() => setModal({ open: false, editing: null })}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Sub Service *</label>
                <select className="form-select" value={form.subServiceId} onChange={e => setForm(f => ({ ...f, subServiceId: e.target.value }))}>
                  <option value="">Select sub service</option>
                  {subServices.map(ss => {
                    const svc = services.find(s => s.id === ss.serviceId);
                    return <option key={ss.id} value={ss.id}>{svc?.name} → {ss.name}</option>;
                  })}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Document Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Bank Statements" />
              </div>
              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.isMandatory} onChange={e => setForm(f => ({ ...f, isMandatory: e.target.checked }))} style={{ width: 16, height: 16 }} />
                  <span className="form-label" style={{ margin: 0 }}>Mandatory Document</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-slds btn-slds-secondary" onClick={() => setModal({ open: false, editing: null })}>Cancel</button>
              <button className="btn-slds btn-slds-primary" onClick={handleSave}>{modal.editing ? "Save" : "Add"}</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
