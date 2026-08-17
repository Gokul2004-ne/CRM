"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { Service } from "@/lib/types";
import { Plus, Pencil, Trash2, Search, IndianRupee, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const PACKAGE_TYPES = [
  { name: "Income Tax Return & Audit", defaultPrice: 7500 },
  { name: "GST Compliance & Filing", defaultPrice: 5000 },
  { name: "TDS & Statutory Compliance", defaultPrice: 4000 },
  { name: "ROC & Company Secretarial", defaultPrice: 8500 },
  { name: "Bookkeeping & Accounting", defaultPrice: 10000 },
  { name: "Payroll & Labor Law Compliance", defaultPrice: 6000 },
  { name: "Trademark & Business Registration", defaultPrice: 5000 },
  { name: "Audit & Assurance Package", defaultPrice: 15000 },
];

const emptyService = (): Service => ({
  id: "", name: "", price: 0, recurrence: "ANNUAL", applicableMonths: [], dueDate: ""
});

export default function PackagesPage() {
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
    if (!form.name) { toast.error("Package name is required"); return; }
    if (modal.editing) { updateService(form); toast.success("Package updated"); }
    else { addService({ ...form, id: `s${Date.now()}` }); toast.success("Package added"); }
    setModal({ open: false, editing: null });
  };

  return (
    <AppShell title="Packages" subtitle={`${services.length} packages configured`}>
      {/* Page Header */}
      <div className="page-header-slds">
        <div>
          <div className="breadcrumb">
            <span>zpluscrm</span>
            <span>/</span>
            <span className="current">Packages</span>
          </div>
          <div className="page-title-slds">Packages Management</div>
          <div className="page-subtitle-slds">
            Configure billing packages and pricing for your practice services.
          </div>
        </div>
        <button className="btn-slds btn-slds-primary" onClick={openAdd}>
          <Plus size={15} />
          <span>Add Package</span>
        </button>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-header">
          <div className="toolbar-controls">
            <div className="search-wrapper">
              <Search className="search-icon" />
              <input
                className="search-input"
                placeholder="Search packages..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Package Cards Grid */}
        {filtered.length > 0 ? (
          <div style={{ padding: 20, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {filtered.map((s, i) => (
              <div
                key={s.id}
                style={{
                  background: "white",
                  border: "1px solid #E2E8F0",
                  borderRadius: 16,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  transition: "box-shadow 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <Package size={18} color="#2563EB" />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Package #{i + 1}</div>
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: "12px 14px",
                  background: "linear-gradient(135deg, #F0FDF4, #DCFCE7)",
                  borderRadius: 10,
                  border: "1px solid #BBF7D0"
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#166534", textTransform: "uppercase", marginBottom: 4 }}>
                    Package Amount
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#15803D", display: "flex", alignItems: "center", gap: 2 }}>
                    <IndianRupee size={18} />
                    {(s.price || 0).toLocaleString("en-IN")}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button
                    className="btn-slds btn-slds-secondary"
                    style={{ flex: 1, padding: "7px 12px", fontSize: 12 }}
                    onClick={() => openEdit(s)}
                  >
                    <Pencil size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    className="btn-slds btn-slds-secondary"
                    style={{ padding: "7px 10px", color: "#DC2626", borderColor: "#FCA5A5" }}
                    onClick={() => setDeleteConfirm(s.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94A3B8" }}>
            <Package size={40} color="#CBD5E1" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontSize: 15, fontWeight: 600 }}>No packages found</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>
              {search ? `No packages matching "${search}"` : "Click \"Add Package\" to create your first package"}
            </div>
          </div>
        )}
      </div>

      {/* Table view */}
      {filtered.length > 0 && (
        <div className="data-table-wrapper" style={{ marginTop: 16 }}>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid #F1F5F9" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
              All Packages — Table View
            </div>
          </div>
          <div className="table-scroll-container">
            <table>
              <thead>
                <tr>
                  <th className="col-num">#</th>
                  <th>Package Name</th>
                  <th className="col-right">Amount (₹)</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id}>
                    <td className="col-num">{i + 1}</td>
                    <td style={{ fontWeight: 700, color: "#0F172A" }}>{s.name}</td>
                    <td className="col-right" style={{ fontWeight: 600, color: "#059669" }}>
                      {formatCurrency(s.price)}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Package Modal — Only Name & Amount */}
      {modal.open && (
        <div className="modal-overlay" onClick={() => setModal({ open: false, editing: null })}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modal.editing ? "Edit Package" : "Add Package"}</div>
              <button className="btn-slds btn-slds-secondary" style={{ padding: "4px 8px" }} onClick={() => setModal({ open: false, editing: null })}>✕</button>
            </div>
            <div className="modal-body" style={{ display: "grid", gap: 16 }}>
              {/* Package Type Preset Selection */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Select Package Type *</label>
                <select
                  className="form-select"
                  value={form.name || ""}
                  onChange={e => {
                    const preset = PACKAGE_TYPES.find(p => p.name === e.target.value);
                    if (preset) {
                      setForm(f => ({ ...f, name: preset.name, price: preset.defaultPrice }));
                    } else {
                      setForm(f => ({ ...f, name: e.target.value }));
                    }
                  }}
                >
                  <option value="">-- Select from package types --</option>
                  {PACKAGE_TYPES.map(pt => (
                    <option key={pt.name} value={pt.name}>{pt.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Package Name *</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. GST Filing Package"
                />
                {/* Quick Selection Chips */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {PACKAGE_TYPES.map(pt => (
                    <button
                      key={pt.name}
                      type="button"
                      className="btn-slds btn-slds-secondary"
                      style={{
                        padding: "4px 8px",
                        fontSize: 11,
                        fontWeight: 600,
                        background: form.name === pt.name ? "#EFF6FF" : "#FFFFFF",
                        borderColor: form.name === pt.name ? "#2563EB" : "#CBD5E1",
                        color: form.name === pt.name ? "#1D4ED8" : "#475569"
                      }}
                      onClick={() => setForm(f => ({ ...f, name: pt.name, price: pt.defaultPrice }))}
                    >
                      {pt.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Package Amount (₹) *</label>
                <input
                  className="form-input"
                  type="number"
                  value={form.price || ""}
                  onChange={e => {
                    const val = e.target.value;
                    setForm(f => ({ ...f, price: val === "" ? 0 : Number(val) }));
                  }}
                  placeholder="Enter amount e.g. 5000"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-slds btn-slds-secondary" onClick={() => setModal({ open: false, editing: null })}>Cancel</button>
              <button className="btn-slds btn-slds-primary" onClick={handleSave}>{modal.editing ? "Save Changes" : "Add Package"}</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header"><div className="modal-title">Delete Package?</div></div>
            <div className="modal-body"><p style={{ color: "#64748B", fontSize: 14 }}>This will permanently delete this package and all associated data. This action cannot be undone.</p></div>
            <div className="modal-footer">
              <button className="btn-slds btn-slds-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-slds btn-slds-primary" style={{ background: "#DC2626" }} onClick={() => { deleteService(deleteConfirm!); setDeleteConfirm(null); toast.success("Package deleted"); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
