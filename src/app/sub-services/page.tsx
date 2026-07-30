"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { SubService, Service } from "@/lib/types";
import { Plus, Pencil, Trash2, Search, Eye, Check, Sparkles, Calendar, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

type Recurrence = "MONTHLY" | "QUARTERLY" | "ANNUALLY";

const recurrenceColors: Record<string, { bg: string; color: string }> = {
  MONTHLY: { bg: "#EFF6FF", color: "#1D4ED8" },
  QUARTERLY: { bg: "#F0FDF4", color: "#15803D" },
  ANNUALLY: { bg: "#FFF7ED", color: "#C2410C" },
};

const empty = (): SubService => ({ id: "", serviceId: "", name: "", serviceIds: [], recurrence: "MONTHLY", dueDate: "" });

export default function ServicesPage() {
  const { services, subServices, requiredDocs, addSubService, updateSubService, deleteSubService } = useAppStore();
  const [search, setSearch] = useState("");
  const [filterPackage, setFilterPackage] = useState("all");
  const [modal, setModal] = useState<{ open: boolean; editing: SubService | null }>({ open: false, editing: null });
  const [viewMainService, setViewMainService] = useState<Service | null>(null);
  const [form, setForm] = useState<SubService>(empty());

  const filtered = useMemo(() =>
    subServices.filter(ss =>
      (filterPackage === "all" || ss.serviceId === filterPackage) &&
      ss.name.toLowerCase().includes(search.toLowerCase())
    ), [subServices, search, filterPackage]);

  const openAdd = () => { setForm(empty()); setModal({ open: true, editing: null }); };
  const openEdit = (ss: SubService) => { setForm({ ...ss, serviceIds: ss.serviceIds || [ss.serviceId] }); setModal({ open: true, editing: ss }); };

  const handleSave = () => {
    if (!form.name || !form.serviceId) { toast.error("Main Package and Service name are required"); return; }
    const serviceData: SubService = {
      ...form,
      serviceIds: [form.serviceId]
    };

    if (modal.editing) {
      updateSubService(serviceData);
      toast.success("Service updated");
    } else {
      addSubService({ ...serviceData, id: `ss${Date.now()}` });
      toast.success("Service added");
    }
    setModal({ open: false, editing: null });
  };

  // Smart due date label based on recurrence
  const getDueDateLabel = (ss: SubService) => {
    if (!ss.dueDate) return "—";
    const recurrence = (ss as any).recurrence;
    if (recurrence === "MONTHLY") return `${ss.dueDate} of each month`;
    if (recurrence === "QUARTERLY") return `Due: ${formatDate(ss.dueDate)}`;
    if (recurrence === "ANNUALLY") return formatDate(ss.dueDate);
    return ss.dueDate;
  };

  // Group services by main package
  const packagesWithServices = useMemo(() => {
    return services.map(svc => ({
      service: svc,
      subs: subServices.filter(ss => ss.serviceId === svc.id || (ss.serviceIds && ss.serviceIds.includes(svc.id)))
    }));
  }, [services, subServices]);

  return (
    <AppShell title="Services Configuration" subtitle={`${subServices.length} services grouped under packages`}>
      <div className="data-table-wrapper">
        <div className="data-table-header">
          <div className="toolbar-controls">
            <div className="search-wrapper">
              <Search className="search-icon" />
              <input className="search-input" placeholder="Search services or packages..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="fy-selector" value={filterPackage} onChange={e => setFilterPackage(e.target.value)}>
              <option value="all">All Packages</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button className="btn-slds btn-slds-primary" onClick={openAdd}><Plus size={15} /> Add Service</button>
        </div>

        {/* Package Cards with Services */}
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#64748B", marginBottom: 12, textTransform: "uppercase" }}>
            Packages Directory & Services
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16, marginBottom: 24 }}>
            {packagesWithServices
              .filter(m => filterPackage === "all" || m.service.id === filterPackage)
              .map(({ service, subs }) => (
                <div key={service.id} className="section-card" style={{ padding: 16, border: "1px solid #CBD5E1", borderRadius: 12, background: "white" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>{service.name}</div>
                      <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                        {subs.length} Service{subs.length === 1 ? "" : "s"} Configured
                      </div>
                    </div>
                    <button
                      className="btn-slds btn-slds-primary"
                      style={{ padding: "5px 12px", fontSize: 12 }}
                      onClick={() => setViewMainService(service)}
                    >
                      <Eye size={13} />
                      <span>View</span>
                    </button>
                  </div>

                  <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {subs.slice(0, 3).map(ss => (
                      <span key={ss.id} className="chip" style={{ background: "#F1F5F9", color: "#334155", fontSize: 11 }}>
                        {ss.name}
                      </span>
                    ))}
                    {subs.length > 3 && (
                      <span className="chip" style={{ background: "#EFF6FF", color: "#1D4ED8", fontSize: 11 }}>
                        +{subs.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>

          {/* Full Services Table */}
          <div className="table-scroll-container">
            <table>
              <thead>
                <tr>
                  <th className="col-num">#</th>
                  <th>Main Package</th>
                  <th>Service Name</th>
                  <th>Recurrence</th>
                  <th>Due Date</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ss, i) => {
                  const parentService = services.find(s => s.id === ss.serviceId);
                  const recurrence = (ss as any).recurrence as string || "MONTHLY";
                  const colors = recurrenceColors[recurrence] || { bg: "#F1F5F9", color: "#334155" };

                  return (
                    <tr key={ss.id}>
                      <td className="col-num">{i + 1}</td>
                      <td>
                        <span className="chip" style={{ background: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>
                          {parentService?.name || "-"}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: "#0F172A" }}>{ss.name}</td>
                      <td>
                        <span className="badge" style={{ background: colors.bg, color: colors.color }}>
                          <RefreshCw size={10} style={{ marginRight: 4 }} />
                          {recurrence}
                        </span>
                      </td>
                      <td>
                        {ss.dueDate ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                            <Calendar size={12} color="#0176D3" />
                            <span style={{ fontWeight: 600, color: "#334155" }}>{getDueDateLabel(ss)}</span>
                          </div>
                        ) : (
                          <span style={{ color: "#94A3B8", fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td className="col-actions">
                        <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                          <button className="btn-slds btn-slds-secondary" style={{ padding: "5px 8px" }} onClick={() => openEdit(ss)} title="Edit">
                            <Pencil size={13} />
                          </button>
                          <button className="btn-slds btn-slds-secondary" style={{ padding: "5px 8px", color: "#DC2626", borderColor: "#FCA5A5" }} onClick={() => { deleteSubService(ss.id); toast.success("Deleted"); }} title="Delete">
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
                      No services found matching search
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Package Drill-Down View Modal */}
      {viewMainService && (
        <div className="command-palette-backdrop" onClick={() => setViewMainService(null)}>
          <div className="command-palette-card" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "18px 24px", background: "#0F172A", color: "white", borderRadius: "16px 16px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{viewMainService.name}</div>
                <div style={{ fontSize: 12, color: "#94A3B8" }}>Services configured under this package</div>
              </div>
              <button className="btn-slds btn-slds-secondary" style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "none" }} onClick={() => setViewMainService(null)}>
                ✕
              </button>
            </div>

            <div style={{ padding: 24, maxHeight: 450, overflowY: "auto" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 12 }}>
                Services under {viewMainService.name}:
              </div>
              {subServices.filter(ss => ss.serviceId === viewMainService.id || (ss.serviceIds && ss.serviceIds.includes(viewMainService.id))).length > 0 ? (
                subServices.filter(ss => ss.serviceId === viewMainService.id || (ss.serviceIds && ss.serviceIds.includes(viewMainService.id))).map(ss => {
                  const reqs = requiredDocs.filter(r => r.subServiceId === ss.id);
                  const recurrence = (ss as any).recurrence as string || "MONTHLY";
                  const colors = recurrenceColors[recurrence] || { bg: "#F1F5F9", color: "#334155" };

                  return (
                    <div key={ss.id} className="section-card" style={{ marginBottom: 12, padding: 14, border: "1px solid #E2E8F0", borderRadius: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>{ss.name}</div>
                          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                            <span className="badge" style={{ background: colors.bg, color: colors.color, fontSize: 11 }}>
                              <RefreshCw size={9} style={{ marginRight: 3 }} />{recurrence}
                            </span>
                            {ss.dueDate && (
                              <span className="chip" style={{ background: "#F0FDF4", color: "#166534", fontSize: 11 }}>
                                <Calendar size={9} style={{ marginRight: 3 }} />{getDueDateLabel(ss)}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          className="btn-slds btn-slds-secondary"
                          style={{ padding: "3px 8px", fontSize: 11 }}
                          onClick={() => { setViewMainService(null); openEdit(ss); }}
                        >
                          <Pencil size={12} /> Edit
                        </button>
                      </div>

                      <div style={{ fontSize: 12, color: "#64748B", marginTop: 8 }}>
                        <strong>Required Documents ({reqs.length}):</strong>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                          {reqs.map(r => (
                            <span key={r.id} className="chip" style={{ background: "#F0FDF4", color: "#166534", fontSize: 11 }}>
                              {r.name} {r.isMandatory ? "*" : ""}
                            </span>
                          ))}
                          {reqs.length === 0 && <span style={{ color: "#94A3B8" }}>None configured</span>}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: 20, textAlign: "center", color: "#94A3B8" }}>
                  No services configured for {viewMainService.name}.
                </div>
              )}
            </div>

            <div style={{ padding: "12px 24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                className="btn-slds btn-slds-primary"
                style={{ fontSize: 12 }}
                onClick={() => { setViewMainService(null); setForm({ ...empty(), serviceId: viewMainService.id }); setModal({ open: true, editing: null }); }}
              >
                <Plus size={13} /> Add Service to this Package
              </button>
              <button className="btn-slds btn-slds-secondary" onClick={() => setViewMainService(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Service Modal */}
      {modal.open && (
        <div className="modal-overlay" onClick={() => setModal({ open: false, editing: null })}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modal.editing ? "Edit Service" : "Add Service"}</div>
              <button className="btn-slds btn-slds-secondary" style={{ padding: "4px 8px" }} onClick={() => setModal({ open: false, editing: null })}>✕</button>
            </div>
            <div className="modal-body" style={{ display: "grid", gap: 14 }}>

              {/* Main Package */}
              <div className="form-group">
                <label className="form-label">Main Package *</label>
                <select className="form-select" value={form.serviceId} onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))}>
                  <option value="">Select a main package</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Service Name */}
              <div className="form-group">
                <label className="form-label">Service Name *</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Type or click a suggested service below..."
                />

                {/* Suggestions */}
                <div style={{ marginTop: 8, padding: 10, background: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
                    <Sparkles size={12} color="#0176D3" />
                    <span>Suggested Services (Click to Auto-Fill):</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {[
                      "GSTR-1 Monthly Sales Return",
                      "GSTR-3B Summary Return",
                      "GSTR-9 Annual Return",
                      "ITR-1 Sahaj Return",
                      "ITR-4 Sugam Return",
                      "ITR-6 Corporate Income Tax",
                      "Tax Audit Report 3CA/3CB",
                      "Form 24Q Salary TDS",
                      "Form 26Q Non-Salary TDS",
                      "DIR-3 KYC Director Registration",
                      "AOC-4 Financial Statement Return",
                      "MGT-7 Annual Return"
                    ].map(suggestion => (
                      <button
                        key={suggestion}
                        type="button"
                        className="chip"
                        style={{
                          background: form.name === suggestion ? "#0176D3" : "#FFFFFF",
                          color: form.name === suggestion ? "#FFFFFF" : "#0F172A",
                          border: "1px solid #CBD5E1",
                          padding: "4px 8px",
                          fontSize: 11,
                          cursor: "pointer",
                          fontWeight: form.name === suggestion ? 700 : 500
                        }}
                        onClick={() => setForm(f => ({ ...f, name: suggestion }))}
                      >
                        + {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recurrence */}
              <div className="form-group">
                <label className="form-label">Recurrence *</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["MONTHLY", "QUARTERLY", "ANNUALLY"] as Recurrence[]).map(r => {
                    const colors = recurrenceColors[r];
                    const isSelected = (form as any).recurrence === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, recurrence: r } as any))}
                        style={{
                          flex: 1,
                          padding: "10px 8px",
                          borderRadius: 10,
                          border: isSelected ? `2px solid ${colors.color}` : "2px solid #E2E8F0",
                          background: isSelected ? colors.bg : "#F8FAFC",
                          color: isSelected ? colors.color : "#64748B",
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: 12,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        {isSelected && <Check size={13} />}
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Smart Due Date based on recurrence */}
              <div className="form-group">
                <label className="form-label">
                  Due Date
                  {(form as any).recurrence === "MONTHLY" && " (Date of each month)"}
                  {(form as any).recurrence === "QUARTERLY" && " (Due date of last month of quarter)"}
                  {(form as any).recurrence === "ANNUALLY" && " (Annual due date)"}
                </label>
                {(form as any).recurrence === "MONTHLY" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      className="form-input"
                      type="number"
                      min={1}
                      max={31}
                      value={(form as any).dueDateDay || ""}
                      onChange={e => setForm(f => ({ ...f, dueDateDay: e.target.value, dueDate: e.target.value } as any))}
                      placeholder="e.g. 20 (20th of every month)"
                      style={{ maxWidth: 220 }}
                    />
                    <span style={{ fontSize: 13, color: "#64748B" }}>of every month</span>
                  </div>
                ) : (
                  <input
                    className="form-input"
                    type="date"
                    value={form.dueDate || ""}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  />
                )}
              </div>

            </div>
            <div className="modal-footer">
              <button className="btn-slds btn-slds-secondary" onClick={() => setModal({ open: false, editing: null })}>Cancel</button>
              <button className="btn-slds btn-slds-primary" onClick={handleSave}>{modal.editing ? "Save Changes" : "Add Service"}</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
