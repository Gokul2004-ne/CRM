"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { SubService, Service } from "@/lib/types";
import { Plus, Pencil, Trash2, Search, Eye, Check, Sparkles, Calendar, RefreshCw, X, Layers } from "lucide-react";
import { toast } from "sonner";
import { formatDate, ALL_MONTHS, ensureUUID } from "@/lib/utils";

type Recurrence = "MONTHLY" | "QUARTERLY" | "ANNUALLY" | "CUSTOM";

const recurrenceColors: Record<string, { bg: string; color: string }> = {
  MONTHLY: { bg: "#EFF6FF", color: "#1D4ED8" },
  QUARTERLY: { bg: "#F0FDF4", color: "#15803D" },
  ANNUALLY: { bg: "#FFF7ED", color: "#C2410C" },
};

const SUGGESTED_SERVICES = [
  "GSTR-1",
  "GSTR-3B",
  "GSTR-9",
  "CMP-08",
  "ITR-1 Sahaj",
  "ITR-4 Sugam",
  "ITR-6 Corporate",
  "Tax Audit 3CA/3CB",
  "Form 24Q Salary TDS",
  "Form 26Q Non-Salary TDS",
  "DIR-3 KYC",
  "AOC-4 Financial",
  "MGT-7 Annual"
];

const GST_SERVICE_PRESETS: Record<string, { recurrence: Recurrence; dueDateDay: number; applicableMonths: string[] }> = {
  "GSTR-1": { recurrence: "MONTHLY", dueDateDay: 11, applicableMonths: [...ALL_MONTHS] },
  "GSTR-3B": { recurrence: "MONTHLY", dueDateDay: 20, applicableMonths: [...ALL_MONTHS] },
  "GSTR-9": { recurrence: "ANNUALLY", dueDateDay: 31, applicableMonths: ["DECEMBER"] },
  "CMP-08": { recurrence: "QUARTERLY", dueDateDay: 18, applicableMonths: ["APRIL", "JULY", "OCTOBER", "JANUARY"] },
  "ITR-1 Sahaj": { recurrence: "ANNUALLY", dueDateDay: 31, applicableMonths: ["JULY"] },
  "ITR-4 Sugam": { recurrence: "ANNUALLY", dueDateDay: 31, applicableMonths: ["JULY"] },
  "ITR-6 Corporate": { recurrence: "ANNUALLY", dueDateDay: 31, applicableMonths: ["OCTOBER"] },
  "Tax Audit 3CA/3CB": { recurrence: "ANNUALLY", dueDateDay: 30, applicableMonths: ["SEPTEMBER"] },
  "Form 24Q Salary TDS": { recurrence: "QUARTERLY", dueDateDay: 31, applicableMonths: ["MAY", "JULY", "OCTOBER", "JANUARY"] },
  "Form 26Q Non-Salary TDS": { recurrence: "QUARTERLY", dueDateDay: 31, applicableMonths: ["MAY", "JULY", "OCTOBER", "JANUARY"] },
  "DIR-3 KYC": { recurrence: "ANNUALLY", dueDateDay: 30, applicableMonths: ["SEPTEMBER"] },
  "AOC-4 Financial": { recurrence: "ANNUALLY", dueDateDay: 30, applicableMonths: ["OCTOBER"] },
  "MGT-7 Annual": { recurrence: "ANNUALLY", dueDateDay: 29, applicableMonths: ["NOVEMBER"] }
};

export interface SelectedServiceRow {
  id: string;
  name: string;
  recurrence: Recurrence;
  applicableMonths: string[];
  dueDateDay: number;
  dueDate?: string;
}

const emptyRow = (defaultName = ""): SelectedServiceRow => ({
  id: `row_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
  name: defaultName,
  recurrence: "MONTHLY",
  applicableMonths: [], // Start empty so user is required to select months
  dueDateDay: 15,
  dueDate: ""
});

const empty = (): SubService => ({ id: "", serviceId: "", name: "", serviceIds: [], recurrence: "MONTHLY", applicableMonths: [], dueDateDay: 15, dueDate: "" });

function getDueDateLabel(ss: SubService): string {
  if (ss.dueDateDay) {
    const day = ss.dueDateDay;
    const suffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
    const dayStr = `${day}${suffix}`;

    if (ss.applicableMonths && ss.applicableMonths.length > 0) {
      if (ss.applicableMonths.length === 12) {
        return `${dayStr} of every month`;
      } else if (ss.applicableMonths.length <= 3) {
        const monthsShort = ss.applicableMonths.map(m => m.substring(0, 3)).join(", ");
        return `${dayStr} (${monthsShort})`;
      } else {
        return `${dayStr} (${ss.applicableMonths.length} months/yr)`;
      }
    }
    return `${dayStr} of month`;
  }
  if (ss.dueDate) {
    return formatDate(ss.dueDate);
  }
  return "15th of month";
}

export default function ServicesPage() {
  const { clients, services, subServices, requiredDocs, addSubService, addSubServicesBatch, updateSubService, deleteSubService } = useAppStore();
  const [search, setSearch] = useState("");
  const [filterPackage, setFilterPackage] = useState("all");
  const [modal, setModal] = useState<{ open: boolean; editing: SubService | null }>({ open: false, editing: null });
  const [viewMainService, setViewMainService] = useState<Service | null>(null);

  // Form state
  const [form, setForm] = useState<SubService>(empty());
  // Selected Services Dynamic Rows (Sketched LinkedIn-style dynamic rows)
  const [selectedRows, setSelectedRows] = useState<SelectedServiceRow[]>([emptyRow()]);
  const [serviceInput, setServiceInput] = useState("");

  const filtered = useMemo(() =>
    subServices.filter(ss => {
      const parentSvc = services.find(s => s.id === ss.serviceId || (ss.serviceId && ensureUUID(s.id) === ensureUUID(ss.serviceId)));
      const matchesPkg = filterPackage === "all" || ss.serviceId === filterPackage || (filterPackage && ensureUUID(ss.serviceId) === ensureUUID(filterPackage));
      const query = search.toLowerCase().trim();
      const matchesSearch = !query ||
                            ss.name.toLowerCase().includes(query) ||
                            (parentSvc?.name || "").toLowerCase().includes(query);
      return matchesPkg && matchesSearch;
    }), [subServices, services, search, filterPackage]);

  const openAdd = () => {
    setForm(empty());
    setSelectedRows([emptyRow()]);
    setServiceInput("");
    setModal({ open: true, editing: null });
  };

  const openEdit = (ss: SubService) => {
    setForm({ ...ss, serviceIds: ss.serviceIds || [ss.serviceId] });
    setSelectedRows([{
      id: ss.id,
      name: ss.name,
      recurrence: ((ss as any).recurrence as Recurrence) || "MONTHLY",
      applicableMonths: ss.applicableMonths || [],
      dueDateDay: ss.dueDateDay || 15,
      dueDate: ss.dueDate || ""
    }]);
    setServiceInput("");
    setModal({ open: true, editing: ss });
  };

  // Add new dynamic row to Selected list
  const addRow = (initialName = "") => {
    setSelectedRows(prev => [...prev, emptyRow(initialName)]);
  };

  const removeRow = (index: number) => {
    setSelectedRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof SelectedServiceRow, value: any) => {
    setSelectedRows(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSuggestedClick = (suggestedName: string) => {
    const preset = GST_SERVICE_PRESETS[suggestedName] || {
      recurrence: "MONTHLY",
      dueDateDay: 15,
      applicableMonths: [...ALL_MONTHS]
    };

    setSelectedRows(prev => {
      // Look for an existing empty slot first
      const emptyIdx = prev.findIndex(r => !r.name.trim());
      if (emptyIdx !== -1) {
        const copy = [...prev];
        copy[emptyIdx] = {
          ...copy[emptyIdx],
          name: suggestedName,
          recurrence: preset.recurrence,
          dueDateDay: preset.dueDateDay,
          applicableMonths: preset.applicableMonths
        };
        return copy;
      }
      return [...prev, {
        id: `row_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: suggestedName,
        recurrence: preset.recurrence,
        dueDateDay: preset.dueDateDay,
        applicableMonths: preset.applicableMonths
      }];
    });
  };

  const handleSave = () => {
    if (!form.serviceId) {
      toast.error("Please select a Main Package");
      return;
    }

    const existingPkgSubs = subServices.filter(ss => ss.serviceId === form.serviceId);

    if (modal.editing) {
      const row = selectedRows[0];
      if (!row || !row.name.trim()) {
        toast.error("Service name is required");
        return;
      }
      if (!row.applicableMonths || row.applicableMonths.length === 0) {
        toast.error("Please select at least one month before saving this service.");
        return;
      }
      const isDup = existingPkgSubs.some(ss => ss.id !== modal.editing?.id && ss.name.toLowerCase().trim() === row.name.toLowerCase().trim());
      if (isDup) {
        toast.error(`❌ Duplicate service: "${row.name.trim()}" already exists in this package!`);
        return;
      }

      const serviceData: SubService = {
        ...form,
        name: row.name.trim(),
        recurrence: row.recurrence,
        applicableMonths: row.applicableMonths,
        dueDateDay: row.dueDateDay || 15,
        dueDate: row.dueDate,
        serviceIds: [form.serviceId],
        clientId: form.clientId,
        clientName: form.clientName || clients.find(c => c.id === form.clientId)?.name || ""
      };
      updateSubService(serviceData);
      toast.success("Service updated successfully!");
    } else {
      const validRows = selectedRows.filter(r => r.name.trim().length > 0);

      if (validRows.length === 0) {
        toast.error("Please add or select at least one service name");
        return;
      }

      // Validate month selections
      const invalidMonthsRow = validRows.find(r => !r.applicableMonths || r.applicableMonths.length === 0);
      if (invalidMonthsRow) {
        toast.error("Please select at least one month before saving this service.");
        return;
      }

      const duplicates: string[] = [];
      const newSubServices: SubService[] = [];

      validRows.forEach((r, i) => {
        const nameClean = r.name.trim();
        const exists = existingPkgSubs.some(ss => ss.name.toLowerCase().trim() === nameClean.toLowerCase()) ||
                       newSubServices.some(ns => ns.name.toLowerCase().trim() === nameClean.toLowerCase());
        if (exists) {
          duplicates.push(nameClean);
        } else {
          const months = r.applicableMonths || [];
          const computedRecurrence = months.length === 12 ? "MONTHLY" : months.length === 4 ? "QUARTERLY" : months.length === 1 ? "ANNUALLY" : "CUSTOM";
          newSubServices.push({
            id: `ss_${Date.now()}_${i}`,
            serviceId: form.serviceId,
            name: nameClean,
            serviceIds: [form.serviceId],
            clientId: form.clientId,
            clientName: form.clientName || clients.find(c => c.id === form.clientId)?.name || "",
            recurrence: computedRecurrence,
            applicableMonths: months,
            dueDateDay: r.dueDateDay || 15,
            dueDate: r.dueDate || ""
          });
        }
      });

      if (duplicates.length > 0) {
        toast.error(`❌ Duplicate service(s) skipped: ${duplicates.join(", ")}`);
        if (newSubServices.length === 0) return;
      }

      if (addSubServicesBatch) {
        addSubServicesBatch(newSubServices);
      } else {
        newSubServices.forEach(ss => addSubService(ss));
      }
      toast.success(`Successfully added ${newSubServices.length} service(s) to package!`);
    }

    setModal({ open: false, editing: null });
  };

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
          <button className="btn-slds btn-slds-primary" onClick={openAdd}><Plus size={15} /> Add Service(s)</button>
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
                      <td style={{ fontWeight: 700, color: "#0F172A" }}>
                        <div>{ss.name}</div>
                        {(ss.clientName || (ss.clientId && clients.find(c => c.id === ss.clientId)?.name)) && (
                          <div style={{ marginTop: 3 }}>
                            <span className="chip" style={{ background: "#F0FDF4", color: "#166534", fontSize: 10, fontWeight: 700 }}>
                              👤 {ss.clientName || clients.find(c => c.id === ss.clientId)?.name}
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge" style={{ background: colors.bg, color: colors.color }}>
                          <RefreshCw size={10} style={{ marginRight: 4 }} />
                          {recurrence}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                          <Calendar size={13} color="#0176D3" />
                          <select
                            className="form-select"
                            style={{
                              fontSize: 12,
                              padding: "4px 8px",
                              fontWeight: 700,
                              color: "#0176D3",
                              background: "#EFF6FF",
                              border: "1px solid #BFDBFE",
                              borderRadius: 6,
                              cursor: "pointer",
                              minWidth: 125
                            }}
                            value={ss.dueDateDay || 15}
                            onChange={(e) => {
                              const newDay = Number(e.target.value);
                              const updated: SubService = {
                                ...ss,
                                dueDateDay: newDay,
                                applicableMonths: ss.applicableMonths || []
                              };
                              updateSubService(updated);
                              toast.success(`Auto-saved! ${ss.name} due date set to ${newDay}${newDay === 1 || newDay === 21 || newDay === 31 ? "st" : newDay === 2 || newDay === 22 ? "nd" : newDay === 3 || newDay === 23 ? "rd" : "th"} of month.`);
                            }}
                            title="Click to edit due date day (auto-saves)"
                          >
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                              <option key={day} value={day}>
                                {day}{day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th"} of month
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="col-actions">
                        <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                          <button className="btn-slds btn-slds-secondary" style={{ padding: "5px 8px" }} onClick={() => openEdit(ss)} title="Edit">
                            <Pencil size={13} />
                          </button>
                          <button
                            className="btn-slds btn-slds-secondary"
                            style={{ padding: "5px 8px", color: "#DC2626", borderColor: "#FCA5A5" }}
                            onClick={async () => {
                              try {
                                await deleteSubService(ss.id);
                                toast.success(`Deleted service "${ss.name}"`);
                              } catch (err) {
                                console.error(err);
                                toast.error("Failed to delete entry from database. Please try again.");
                              }
                            }}
                            title="Delete"
                          >
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
                onClick={() => { setViewMainService(null); setForm({ ...empty(), serviceId: viewMainService.id }); setSelectedRows([emptyRow()]); setModal({ open: true, editing: null }); }}
              >
                <Plus size={13} /> Add Services to this Package
              </button>
              <button className="btn-slds btn-slds-secondary" onClick={() => setViewMainService(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Service Modal — Handwritten Sketch Workflow */}
      {modal.open && (
        <div className="modal-overlay" onClick={() => setModal({ open: false, editing: null })}>
          <div className="modal" style={{ maxWidth: 740, width: "95%" }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                {modal.editing ? "Edit Service" : "Add Service"}
              </div>
              <button className="btn-slds btn-slds-secondary" style={{ padding: "4px 8px" }} onClick={() => setModal({ open: false, editing: null })}>✕</button>
            </div>

            <div className="modal-body" style={{ display: "grid", gap: 16, maxHeight: "78vh", overflowY: "auto" }}>

              {/* 1. Main Package Selection */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Main Package *</label>
                <select
                  className="form-select"
                  style={{ fontSize: 13, padding: 10 }}
                  value={form.serviceId}
                  onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))}
                >
                  <option value="">Select a main Package</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* 1.1 Client Assignment (Optional) */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Client (Optional)</label>
                <select
                  className="form-select"
                  style={{ fontSize: 13, padding: 10 }}
                  value={form.clientId || ""}
                  onChange={e => {
                    const cId = e.target.value;
                    const cObj = clients.find(c => c.id === cId || (cId && ensureUUID(c.id) === ensureUUID(cId)));
                    setForm(f => ({ ...f, clientId: cId || undefined, clientName: cObj?.name || undefined }));
                  }}
                >
                  <option value="">All Clients (General Package Default)</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* 2. Service Name Search/Input */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: 13 }}>Service Name</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="form-input"
                    style={{ fontSize: 13 }}
                    value={serviceInput}
                    onChange={e => setServiceInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && serviceInput.trim()) {
                        e.preventDefault();
                        addRow(serviceInput.trim());
                        setServiceInput("");
                      }
                    }}
                    placeholder="Type or click a suggested service below..."
                  />
                  <button
                    type="button"
                    className="btn-slds btn-slds-primary"
                    style={{ padding: "6px 14px", fontSize: 12, whiteSpace: "nowrap" }}
                    onClick={() => {
                      if (serviceInput.trim()) {
                        addRow(serviceInput.trim());
                        setServiceInput("");
                      } else {
                        addRow();
                      }
                    }}
                  >
                    + Add Row
                  </button>
                </div>
              </div>

              {/* 3. Selected Services Dynamic List (Sketched Layout: Service Name, Recurrence, Due Date, + symbol) */}
              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "#0F172A" }}>
                    Selected ({selectedRows.length})
                  </label>
                  {!modal.editing && (
                    <button
                      type="button"
                      className="btn-slds btn-slds-secondary"
                      style={{ padding: "3px 8px", fontSize: 11 }}
                      onClick={() => addRow()}
                    >
                      + Add Another Service
                    </button>
                  )}
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  {selectedRows.map((row, idx) => (
                    <div
                      key={row.id || idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        background: "#F8FAFC",
                        border: "1px solid #CBD5E1",
                        borderRadius: 12,
                        flexWrap: "wrap"
                      }}
                    >
                      {/* Service Name Input */}
                      <div style={{ flex: "1 1 180px" }}>
                        <input
                          className="form-input"
                          style={{ fontSize: 13, padding: "8px 10px", fontWeight: 700, color: "#0F172A", background: "white" }}
                          value={row.name}
                          onChange={e => updateRow(idx, "name", e.target.value)}
                          placeholder="e.g. GSTR-1"
                        />
                      </div>

                      {/* Plus Symbol (+) Beside Service Name to Append Below + Delete (✕) */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                        <button
                          type="button"
                          className="btn-slds btn-slds-primary"
                          style={{ width: 32, height: 32, padding: 0, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}
                          onClick={() => addRow()}
                          title="Click plus symbol to add another service below"
                        >
                          <Plus size={16} />
                        </button>
                        {selectedRows.length > 1 && (
                          <button
                            type="button"
                            className="btn-slds btn-slds-secondary"
                            style={{ width: 32, height: 32, padding: 0, borderRadius: 8, color: "#DC2626", borderColor: "#FCA5A5", display: "flex", alignItems: "center", justifyContent: "center" }}
                            onClick={() => removeRow(idx)}
                            title="Remove row"
                          >
                            <X size={15} />
                          </button>
                        )}
                      </div>

                      {/* 1. Multi-Month Selector (12-Month Checkboxes) */}
                      <div
                        style={{
                          width: "100%",
                          marginTop: 8,
                          padding: 12,
                          background: (row.applicableMonths || []).length === 0 ? "#FEF2F2" : "#FFFFFF",
                          borderRadius: 8,
                          border: (row.applicableMonths || []).length === 0 ? "1.5px solid #EF4444" : "1px solid #CBD5E1",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: (row.applicableMonths || []).length === 0 ? "#DC2626" : "#0F172A" }}>
                            🗓️ Select Applicable Months <span style={{ color: "#DC2626" }}>*</span>
                          </span>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              className="btn-slds btn-slds-secondary"
                              style={{ padding: "2px 6px", fontSize: 10, fontWeight: 600 }}
                              onClick={() => updateRow(idx, "applicableMonths", [...ALL_MONTHS])}
                              title="Select all 12 calendar months"
                            >
                              Monthly (All 12)
                            </button>
                            <button
                              type="button"
                              className="btn-slds btn-slds-secondary"
                              style={{ padding: "2px 6px", fontSize: 10, fontWeight: 600 }}
                              onClick={() => updateRow(idx, "applicableMonths", ["June", "September", "December", "March"])}
                              title="Select quarterly compliance months (Jun, Sep, Dec, Mar)"
                            >
                              Quarterly (4 Mo)
                            </button>
                            <button
                              type="button"
                              className="btn-slds btn-slds-secondary"
                              style={{ padding: "2px 6px", fontSize: 10, fontWeight: 600 }}
                              onClick={() => updateRow(idx, "applicableMonths", ["July"])}
                              title="Select annual compliance month (July)"
                            >
                              Annual (1 Mo)
                            </button>
                            {(row.applicableMonths || []).length > 0 && (
                              <button
                                type="button"
                                className="btn-slds btn-slds-secondary"
                                style={{ padding: "2px 6px", fontSize: 10, fontWeight: 600, color: "#DC2626", borderColor: "#FCA5A5" }}
                                onClick={() => updateRow(idx, "applicableMonths", [])}
                                title="Clear all month selections"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
                          {ALL_MONTHS.map(m => {
                            const isChecked = (row.applicableMonths || []).includes(m);
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
                                  background: isChecked ? "#EFF6FF" : "#F8FAFC",
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
                                    const current = row.applicableMonths || [];
                                    const next = e.target.checked
                                      ? [...current, m]
                                      : current.filter(x => x !== m);
                                    updateRow(idx, "applicableMonths", next);
                                  }}
                                />
                                <span>{m.substring(0, 3)}</span>
                              </label>
                            );
                          })}
                        </div>
                        {(row.applicableMonths || []).length === 0 && (
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                            ⚠️ Please select at least one month before saving this service.
                          </div>
                        )}

                        {/* 2. Single Day Picker (1-31) */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, paddingTop: 8, borderTop: "1px dashed #E2E8F0" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>
                            ⏰ Due Day of Month (1–31):
                          </span>
                          <select
                            className="form-select"
                            style={{ width: 110, fontSize: 12, padding: "5px 8px", fontWeight: 700, background: "#F8FAFC" }}
                            value={row.dueDateDay || 15}
                            onChange={e => updateRow(idx, "dueDateDay", Number(e.target.value))}
                          >
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                              <option key={day} value={day}>{day}{day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"} day</option>
                            ))}
                          </select>
                          <span style={{ fontSize: 11, color: "#64748B" }}>
                            (Applies to all selected months perpetually every year. Days 29–31 auto-adjust for shorter months)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Suggested Box (Chips: GSTR-1, GSTR-3B, GSTR-9, etc.) */}
              <div style={{ padding: 14, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginBottom: 10, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={14} color="#166534" />
                  <span>Suggested Services (Click to Add Row):</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {SUGGESTED_SERVICES.map(suggestion => (
                    <button
                      key={suggestion}
                      type="button"
                      style={{
                        background: "#FFFFFF",
                        color: "#0F172A",
                        border: "1px solid #CBD5E1",
                        padding: "6px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        cursor: "pointer",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                        transition: "all 0.15s ease"
                      }}
                      onClick={() => handleSuggestedClick(suggestion)}
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>

            </div>
            <div className="modal-footer">
              <button className="btn-slds btn-slds-secondary" onClick={() => setModal({ open: false, editing: null })}>Cancel</button>
              <button className="btn-slds btn-slds-primary" onClick={handleSave}>
                {modal.editing ? "Save Changes" : "Add Service"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
