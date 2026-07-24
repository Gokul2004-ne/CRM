"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { SubService, Service } from "@/lib/types";
import { Plus, Pencil, Trash2, Search, Eye, Layers, Check, Briefcase, Sparkles } from "lucide-react";
import { toast } from "sonner";

const empty = (): SubService => ({ id: "", serviceId: "", name: "", serviceIds: [] });

export default function SubServicesPage() {
  const { services, subServices, requiredDocs, addSubService, updateSubService, deleteSubService } = useAppStore();
  const [search, setSearch] = useState("");
  const [filterService, setFilterService] = useState("all");
  const [modal, setModal] = useState<{ open: boolean; editing: SubService | null }>({ open: false, editing: null });
  const [viewMainService, setViewMainService] = useState<Service | null>(null);
  const [form, setForm] = useState<SubService>(empty());

  const filtered = useMemo(() =>
    subServices.filter(ss =>
      (filterService === "all" || ss.serviceId === filterService) &&
      ss.name.toLowerCase().includes(search.toLowerCase())
    ), [subServices, search, filterService]);

  const openAdd = () => { setForm(empty()); setModal({ open: true, editing: null }); };
  const openEdit = (ss: SubService) => { setForm({ ...ss, serviceIds: ss.serviceIds || [ss.serviceId] }); setModal({ open: true, editing: ss }); };

  const handleSave = () => {
    if (!form.name || !form.serviceId) { toast.error("Main Service and Sub-service name are required"); return; }
    const subServiceData: SubService = {
      ...form,
      serviceIds: [form.serviceId] // Main service is automatically taken for grouped service
    };

    if (modal.editing) {
      updateSubService(subServiceData);
      toast.success("Sub-service updated");
    } else {
      addSubService({ ...subServiceData, id: `ss${Date.now()}` });
      toast.success("Sub-service added");
    }
    setModal({ open: false, editing: null });
  };

  const toggleGroupedService = (svcId: string) => {
    const current = form.serviceIds || [];
    if (current.includes(svcId)) {
      setForm({ ...form, serviceIds: current.filter(id => id !== svcId) });
    } else {
      setForm({ ...form, serviceIds: [...current, svcId] });
    }
  };

  // Group sub-services by Main Service for the Main Service View drill-down layout
  const mainServicesWithSubs = useMemo(() => {
    return services.map(svc => ({
      service: svc,
      subs: subServices.filter(ss => ss.serviceId === svc.id || (ss.serviceIds && ss.serviceIds.includes(svc.id)))
    }));
  }, [services, subServices]);

  return (
    <AppShell title="Sub Services Configuration" subtitle={`${subServices.length} sub-services grouped under main services`}>
      <div className="data-table-wrapper">
        <div className="data-table-header">
          <div className="toolbar-controls">
            <div className="search-wrapper">
              <Search className="search-icon" />
              <input className="search-input" placeholder="Search sub-services or services..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="fy-selector" value={filterService} onChange={e => setFilterService(e.target.value)}>
              <option value="all">All Main Services</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button className="btn-slds btn-slds-primary" onClick={openAdd}><Plus size={15} /> Add Sub Service</button>
        </div>

        {/* Main Service Layout with View Drill-Down */}
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#64748B", marginBottom: 12, textTransform: "uppercase" }}>
            Main Services Directory & Expandable Views
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16, marginBottom: 24 }}>
            {mainServicesWithSubs
              .filter(m => filterService === "all" || m.service.id === filterService)
              .map(({ service, subs }) => (
                <div key={service.id} className="section-card" style={{ padding: 16, border: "1px solid #CBD5E1", borderRadius: 12, background: "white" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>{service.name}</div>
                      <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                        {subs.length} Sub-Service{subs.length === 1 ? "" : "s"} Configured
                      </div>
                    </div>
                    {/* Section 3: View option to see sub-services under main service */}
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

          {/* Full Sub-Services Table (Due Date Removed as requested) */}
          <div className="table-scroll-container">
            <table>
              <thead>
                <tr>
                  <th className="col-num">#</th>
                  <th>Main Service</th>
                  <th>Sub Service Name</th>
                  <th>Grouped Services</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ss, i) => {
                  const parentService = services.find(s => s.id === ss.serviceId);
                  const groupedServices = services.filter(s => (ss.serviceIds || [ss.serviceId]).includes(s.id));

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
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {groupedServices.map(gs => (
                            <span key={gs.id} className="chip" style={{ background: "#F0FDF4", color: "#166534", fontSize: 11 }}>
                              <Briefcase size={10} style={{ marginRight: 4 }} />
                              {gs.name}
                            </span>
                          ))}
                        </div>
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
                    <td colSpan={5} className="empty-table-cell">
                      No sub-services found matching search
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Main Service Drill-Down View Modal (Section 3 Requirement) */}
      {viewMainService && (
        <div className="command-palette-backdrop" onClick={() => setViewMainService(null)}>
          <div className="command-palette-card" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "18px 24px", background: "#0F172A", color: "white", borderRadius: "16px 16px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{viewMainService.name}</div>
                <div style={{ fontSize: 12, color: "#94A3B8" }}>Sub-services and associated services under this main service</div>
              </div>
              <button className="btn-slds btn-slds-secondary" style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "none" }} onClick={() => setViewMainService(null)}>
                ✕
              </button>
            </div>

            <div style={{ padding: 24, maxHeight: 450, overflowY: "auto" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 12 }}>
                Sub-Services List under {viewMainService.name}:
              </div>
              {subServices.filter(ss => ss.serviceId === viewMainService.id || (ss.serviceIds && ss.serviceIds.includes(viewMainService.id))).length > 0 ? (
                subServices.filter(ss => ss.serviceId === viewMainService.id || (ss.serviceIds && ss.serviceIds.includes(viewMainService.id))).map(ss => {
                  const reqs = requiredDocs.filter(r => r.subServiceId === ss.id);

                  return (
                    <div key={ss.id} className="section-card" style={{ marginBottom: 12, padding: 14, border: "1px solid #E2E8F0", borderRadius: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>{ss.name}</div>
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
                  No sub-services configured for {viewMainService.name}.
                </div>
              )}
            </div>

            <div style={{ padding: "12px 24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end" }}>
              <button className="btn-slds btn-slds-secondary" onClick={() => setViewMainService(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Sub Service Modal (With "Add Services" option and NO Due Date field) */}
      {modal.open && (
        <div className="modal-overlay" onClick={() => setModal({ open: false, editing: null })}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modal.editing ? "Edit Sub Service" : "Add Sub Service"}</div>
              <button className="btn-slds btn-slds-secondary" style={{ padding: "4px 8px" }} onClick={() => setModal({ open: false, editing: null })}>✕</button>
            </div>
            <div className="modal-body" style={{ display: "grid", gap: 14 }}>
              <div className="form-group"><label className="form-label">Main Service *</label>
                <select className="form-select" value={form.serviceId} onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))}>
                  <option value="">Select a main service</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Sub Service Name *</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Type or click a suggested sub-service below..."
                />

                {/* Automatic Sub-Service Suggestions List */}
                <div style={{ marginTop: 8, padding: 10, background: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
                    <Sparkles size={12} color="#0176D3" />
                    <span>Suggested Sub-Service Types (Click to Auto-Fill):</span>
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

              {/* NOTE: Due Date and extra Add Services fields removed — Main Service is automatically taken as the grouped service */}
            </div>
            <div className="modal-footer">
              <button className="btn-slds btn-slds-secondary" onClick={() => setModal({ open: false, editing: null })}>Cancel</button>
              <button className="btn-slds btn-slds-primary" onClick={handleSave}>{modal.editing ? "Save Changes" : "Add Sub-Service"}</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

