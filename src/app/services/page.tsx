"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { Service } from "@/lib/types";
import { Plus, Pencil, Trash2, Search, IndianRupee, Package } from "lucide-react";
import { formatCurrency, ALL_MONTHS } from "@/lib/utils";
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
  id: "", name: "", price: 0, recurrence: "MONTHLY", applicableMonths: [], dueDate: ""
});

export default function PackagesPage() {
  const { services, addService, updateService, deleteService } = useAppStore();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ open: boolean; editing: Service | null }>({ open: false, editing: null });
  const [form, setForm] = useState<Service>(emptyService());

  const filtered = useMemo(() =>
    services.filter(s => s.name.toLowerCase().includes(search.toLowerCase())), [services, search]);

  const openAdd = () => { setForm(emptyService()); setModal({ open: true, editing: null }); };
  const openEdit = (s: Service) => { setForm({ ...s, applicableMonths: s.applicableMonths || [] }); setModal({ open: true, editing: s }); };

  const handleSave = () => {
    if (!form.name || !form.name.trim()) {
      toast.error("Package name is required");
      return;
    }
    if (!form.applicableMonths || form.applicableMonths.length === 0) {
      toast.error("Please select at least one month before saving this service.");
      return;
    }
    const months = form.applicableMonths;
    const computedRecurrence = months.length === 12 ? "MONTHLY" : months.length === 4 ? "QUARTERLY" : months.length === 1 ? "ANNUALLY" : "CUSTOM";
    const payload: Service = { ...form, recurrence: computedRecurrence };
    if (modal.editing) { updateService(payload); toast.success("Package updated"); }
    else { addService({ ...payload, id: `s${Date.now()}` }); toast.success("Package added"); }
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
                    onClick={() => {
                      deleteService(s.id);
                      toast.success(`Deleted package "${s.name}"`);
                    }}
                    title="Delete Package"
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
                        <button
                          className="btn-slds btn-slds-secondary"
                          style={{ padding: "5px 8px", color: "#DC2626", borderColor: "#FCA5A5" }}
                          onClick={() => {
                            deleteService(s.id);
                            toast.success(`Deleted package "${s.name}"`);
                          }}
                          title="Delete"
                        >
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

      {/* Add / Edit Package Modal */}
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
                <label className="form-label" style={{ fontWeight: 700 }}>Select Package Type Preset (Optional)</label>
                <select
                  className="form-select"
                  value=""
                  onChange={e => {
                    const preset = PACKAGE_TYPES.find(p => p.name === e.target.value);
                    if (preset) {
                      setForm(f => ({ ...f, name: preset.name, price: preset.defaultPrice }));
                    }
                  }}
                >
                  <option value="">-- Choose a package template --</option>
                  {PACKAGE_TYPES.map(pt => (
                    <option key={pt.name} value={pt.name}>{pt.name} (₹{pt.defaultPrice.toLocaleString('en-IN')})</option>
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
                <label className="form-label" style={{ fontWeight: 700 }}>Package Amount (₹) *</label>
                <input
                  className="form-input"
                  type="number"
                  value={form.price === 0 ? "" : form.price}
                  onChange={e => {
                    const val = e.target.value;
                    setForm(f => ({ ...f, price: val === "" ? 0 : Math.max(0, Number(val)) }));
                  }}
                  placeholder="Enter package price e.g. 5000"
                />
              </div>

              {/* Applicable Months Selection (Mandatory) */}
              <div
                style={{
                  width: "100%",
                  padding: 12,
                  background: (form.applicableMonths || []).length === 0 ? "#FEF2F2" : "#F8FAFC",
                  borderRadius: 8,
                  border: (form.applicableMonths || []).length === 0 ? "1.5px solid #EF4444" : "1px solid #CBD5E1",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: (form.applicableMonths || []).length === 0 ? "#DC2626" : "#0F172A" }}>
                    🗓️ Select Applicable Months <span style={{ color: "#DC2626" }}>*</span>
                  </span>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn-slds btn-slds-secondary"
                      style={{ padding: "2px 6px", fontSize: 10, fontWeight: 600 }}
                      onClick={() => setForm(f => ({ ...f, applicableMonths: [...ALL_MONTHS] }))}
                      title="Select all 12 calendar months"
                    >
                      Monthly (All 12)
                    </button>
                    <button
                      type="button"
                      className="btn-slds btn-slds-secondary"
                      style={{ padding: "2px 6px", fontSize: 10, fontWeight: 600 }}
                      onClick={() => setForm(f => ({ ...f, applicableMonths: ["June", "September", "December", "March"] }))}
                      title="Select quarterly compliance months"
                    >
                      Quarterly (4 Mo)
                    </button>
                    <button
                      type="button"
                      className="btn-slds btn-slds-secondary"
                      style={{ padding: "2px 6px", fontSize: 10, fontWeight: 600 }}
                      onClick={() => setForm(f => ({ ...f, applicableMonths: ["July"] }))}
                      title="Select annual compliance month"
                    >
                      Annual (1 Mo)
                    </button>
                    {(form.applicableMonths || []).length > 0 && (
                      <button
                        type="button"
                        className="btn-slds btn-slds-secondary"
                        style={{ padding: "2px 6px", fontSize: 10, fontWeight: 600, color: "#DC2626", borderColor: "#FCA5A5" }}
                        onClick={() => setForm(f => ({ ...f, applicableMonths: [] }))}
                        title="Clear all month selections"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
                  {ALL_MONTHS.map(m => {
                    const isChecked = (form.applicableMonths || []).includes(m);
                    return (
                      <label
                        key={m}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 11,
                          fontWeight: isChecked ? 700 : 500,
                          color: isChecked ? "#1D4ED8" : "#475569",
                          padding: "5px 8px",
                          background: isChecked ? "#EFF6FF" : "#FFFFFF",
                          border: isChecked ? "1px solid #93C5FD" : "1px solid #E2E8F0",
                          borderRadius: 6,
                          cursor: "pointer",
                          userSelect: "none"
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            const current = form.applicableMonths || [];
                            const next = e.target.checked
                              ? [...current, m]
                              : current.filter(x => x !== m);
                            setForm(f => ({ ...f, applicableMonths: next }));
                          }}
                        />
                        <span>{m.substring(0, 3)}</span>
                      </label>
                    );
                  })}
                </div>
                {(form.applicableMonths || []).length === 0 && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                    ⚠️ Please select at least one month before saving this service.
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-slds btn-slds-secondary" onClick={() => setModal({ open: false, editing: null })}>Cancel</button>
              <button className="btn-slds btn-slds-primary" onClick={handleSave}>{modal.editing ? "Save Changes" : "Add Package"}</button>
            </div>
          </div>
        </div>
      )}

    </AppShell>
  );
}
