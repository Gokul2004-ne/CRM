"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { AssignedService, SubService } from "@/lib/types";
import { Plus, Pencil, Trash2, Search, Eye, MessageCircle, AlertTriangle, CheckCircle2, Clock, Circle, Calendar } from "lucide-react";
import { formatDate, getCurrentFY, getFYOptions, getWhatsAppLink, ALL_MONTHS, getValidDateForMonthDay } from "@/lib/utils";
import { toast } from "sonner";

function getNextUpcomingDueDate(applicableMonths?: string[], targetDay: number = 15): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const monthIndices = (applicableMonths && applicableMonths.length > 0 ? applicableMonths : ALL_MONTHS)
    .map(m => ALL_MONTHS.indexOf(m))
    .filter(idx => idx >= 0)
    .sort((a, b) => a - b);

  for (const mIdx of monthIndices) {
    const candidate = getValidDateForMonthDay(currentYear, mIdx, targetDay);
    if (candidate >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
      return candidate.toISOString().split("T")[0];
    }
  }

  const firstMonthIdx = monthIndices[0] ?? 0;
  const candidate = getValidDateForMonthDay(currentYear + 1, firstMonthIdx, targetDay);
  return candidate.toISOString().split("T")[0];
}

type DeliveryStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

const statusConfig = {
  PENDING: { label: "Not Started", color: "#64748B", bg: "#F1F5F9", border: "#CBD5E1", icon: Circle },
  IN_PROGRESS: { label: "In Progress", color: "#D97706", bg: "#FFFBEB", border: "#FCD34D", icon: Clock },
  COMPLETED: { label: "Completed", color: "#059669", bg: "#F0FDF4", border: "#6EE7B7", icon: CheckCircle2 },
};

const DEFAULT_SUB_SERVICES: SubService[] = [
  { id: "ss_itr1", serviceId: "s1", name: "Income Tax Return (ITR-1/2/3/4)", recurrence: "ANNUALLY", dueDateDay: 31, applicableMonths: ["July"] },
  { id: "ss_tax_audit", serviceId: "s1", name: "Tax Audit u/s 44AB", recurrence: "ANNUALLY", dueDateDay: 30, applicableMonths: ["September"] },
  { id: "ss_adv_tax", serviceId: "s1", name: "Advance Tax Payment", recurrence: "QUARTERLY", dueDateDay: 15, applicableMonths: ["June", "September", "December", "March"] },
  { id: "ss_gstr3b", serviceId: "s2", name: "GSTR 3B Return", recurrence: "MONTHLY", dueDateDay: 20, applicableMonths: [...ALL_MONTHS] },
  { id: "ss_gstr1", serviceId: "s2", name: "GSTR 1 Return", recurrence: "MONTHLY", dueDateDay: 11, applicableMonths: [...ALL_MONTHS] },
  { id: "ss_gstr9", serviceId: "s2", name: "GSTR 9 Annual Return", recurrence: "ANNUALLY", dueDateDay: 31, applicableMonths: ["December"] },
  { id: "ss_tds26q", serviceId: "s3", name: "TDS Return (26Q/27Q)", recurrence: "QUARTERLY", dueDateDay: 31, applicableMonths: ["July", "October", "January", "May"] },
  { id: "ss_roc_aoc4", serviceId: "s4", name: "ROC Annual Filing (AOC-4/MGT-7)", recurrence: "ANNUALLY", dueDateDay: 30, applicableMonths: ["October"] },
];

const empty = () => ({
  id: "", clientId: "", serviceId: "", subServiceIds: [],
  financialYear: getCurrentFY(), amountBilled: 0, amountReceived: 0, amountPending: 0, dueDate: new Date().toISOString().split("T")[0]
});

export default function AssignPage() {
  const { clients, services, subServices, assignedServices, selectedFY, addAssignedService, updateAssignedService, deleteAssignedService } = useAppStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "ALL">("ALL");
  const [modal, setModal] = useState<{ open: boolean; editing: AssignedService | null }>({ open: false, editing: null });
  const [viewDetailModal, setViewDetailModal] = useState<{ open: boolean; assignment: AssignedService | null }>({ open: false, assignment: null });
  const [form, setForm] = useState<any>(empty());

  const getDueStatus = (dueDateStr?: string) => {
    if (!dueDateStr) return { days: 999, category: "GREEN" as const, label: "On Schedule" };
    const due = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const days = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return { days, category: "RED" as const, label: days === 0 ? "Due Today!" : `${Math.abs(days)} Days Overdue` };
    if (days <= 9) return { days, category: "RED" as const, label: `Due in ${days} Days (Critical)` };
    if (days <= 15) return { days, category: "YELLOW" as const, label: `Due in ${days} Days` };
    return { days, category: "GREEN" as const, label: `Due in ${days} Days` };
  };

  const filtered = useMemo(() => {
    const list = assignedServices
      .filter(a => a.financialYear === selectedFY)
      .filter(a => {
        const client = clients.find(c => c.id === a.clientId);
        const service = services.find(s => s.id === a.serviceId);
        const subs = subServices.filter(ss => a.subServiceIds?.includes(ss.id));
        const subName = subs.map(s => s.name).join(" ");
        return (client?.name || "").toLowerCase().includes(search.toLowerCase()) ||
               (service?.name || "").toLowerCase().includes(search.toLowerCase()) ||
               subName.toLowerCase().includes(search.toLowerCase());
      });

    return list
      .filter(a => statusFilter === "ALL" || (a.status || "PENDING") === statusFilter)
      .sort((a, b) => {
        const daysA = getDueStatus(a.dueDate).days;
        const daysB = getDueStatus(b.dueDate).days;
        return daysA - daysB;
      });
  }, [assignedServices, clients, services, subServices, search, selectedFY, statusFilter]);

  const openAdd = () => { setForm(empty()); setModal({ open: true, editing: null }); };
  const openEdit = (a: AssignedService) => { setForm({ ...a }); setModal({ open: true, editing: a }); };

  const availableSubServices = useMemo(() => {
    const list = subServices.length > 0 ? subServices : DEFAULT_SUB_SERVICES;
    if (!form.serviceId) return list;
    const directMatches = list.filter(ss => ss.serviceId === form.serviceId || (ss.serviceIds && ss.serviceIds.includes(form.serviceId)));
    return directMatches.length > 0 ? directMatches : list;
  }, [subServices, form.serviceId]);

  const handleSave = () => {
    if (!form.clientId || !form.serviceId) {
      toast.error("Please select a Client Name and a Package");
      return;
    }

    const targetSubIds = (form.subServiceIds && form.subServiceIds.length > 0)
      ? form.subServiceIds
      : availableSubServices.map(ss => ss.id);

    if (modal.editing) {
      updateAssignedService({ ...form, id: form.id });
      toast.success("Assignment updated successfully!");
    } else {
      if (targetSubIds.length > 0) {
        targetSubIds.forEach((ssId: string, idx: number) => {
          const ssObj = subServices.find(s => s.id === ssId);
          const targetDay = ssObj?.dueDateDay || 15;
          const monthsList = ssObj?.applicableMonths && ssObj.applicableMonths.length > 0 ? ssObj.applicableMonths : ALL_MONTHS;
          const calculatedDueDate = getNextUpcomingDueDate(monthsList, targetDay);

          const newRecord: AssignedService = {
            id: `as_${Date.now()}_${idx}_${Math.random().toString(36).substring(2,6)}`,
            clientId: form.clientId,
            serviceId: form.serviceId || ssObj?.serviceId || "",
            subServiceIds: [ssId],
            financialYear: selectedFY || getCurrentFY(),
            amountBilled: 0, amountReceived: 0, amountPending: 0,
            status: "PENDING",
            dueDate: ssObj?.dueDate || calculatedDueDate
          };
          addAssignedService(newRecord);
        });
        toast.success(`Assigned ${targetSubIds.length} service(s) to client in separate rows!`);
      } else {
        const pkgObj = services.find(s => s.id === form.serviceId);
        const newRecord: AssignedService = {
          id: `as_${Date.now()}_${Math.random().toString(36).substring(2,6)}`,
          clientId: form.clientId, serviceId: form.serviceId, subServiceIds: [],
          financialYear: selectedFY || getCurrentFY(),
          amountBilled: pkgObj?.price || 0, amountReceived: 0, amountPending: pkgObj?.price || 0,
          status: "PENDING", dueDate: new Date().toISOString().split("T")[0]
        };
        addAssignedService(newRecord);
        toast.success(`Package "${pkgObj?.name || 'Package'}" assigned to client!`);
      }
    }
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

  const handleStatusCycle = (a: AssignedService) => {
    const order: DeliveryStatus[] = ["PENDING", "IN_PROGRESS", "COMPLETED"];
    const current = (a.status as DeliveryStatus) || "PENDING";
    const next = order[(order.indexOf(current) + 1) % order.length];
    updateAssignedService({ ...a, status: next });
    toast.success(`Status updated to ${statusConfig[next].label}`);
  };

  const statusCounts = useMemo(() => {
    const base = assignedServices.filter(a => a.financialYear === selectedFY);
    return {
      ALL: base.length,
      PENDING: base.filter(a => (a.status || "PENDING") === "PENDING").length,
      IN_PROGRESS: base.filter(a => a.status === "IN_PROGRESS").length,
      COMPLETED: base.filter(a => a.status === "COMPLETED").length,
    };
  }, [assignedServices, selectedFY]);

  return (
    <AppShell title="Assign Packages" subtitle="Assign packages to clients with due date tracking">
      <div className="data-table-wrapper">
        <div className="data-table-header">
          <div className="toolbar-controls">
            <div className="search-wrapper">
              <Search className="search-icon" />
              <input className="search-input" placeholder="Search client, package or service..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {/* Progress Status Filter Tabs */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["ALL", "PENDING", "IN_PROGRESS", "COMPLETED"] as const).map(tab => {
                const cfg = tab === "ALL"
                  ? { color: "#4F46E5", bg: "#EEF2FF" }
                  : statusConfig[tab];
                const label = tab === "ALL" ? "All" : statusConfig[tab].label;
                const isActive = statusFilter === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    style={{
                      padding: "5px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 800,
                      background: isActive ? cfg.bg : "#F8FAFC",
                      color: isActive ? cfg.color : "#64748B",
                      border: isActive ? `2px solid ${cfg.color}` : "1px solid #CBD5E1",
                      transition: "all 0.15s",
                    }}
                  >
                    {label} ({statusCounts[tab]})
                  </button>
                );
              })}
            </div>
          </div>
          <button className="btn-slds btn-slds-primary" onClick={openAdd}><Plus size={15} /> Assign Package</button>
        </div>

        <div style={{ padding: "10px 16px", background: "#FEF2F2", borderBottom: "1px solid #FECACA", display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#991B1B", fontWeight: 700 }}>
          <AlertTriangle size={16} color="#DC2626" />
          <span>Priority Alert: Approaching / Overdue Due Dates are automatically highlighted RED on top.</span>
        </div>

        <div className="table-scroll-container">
          <table>
            <thead>
              <tr>
                <th className="col-num">#</th>
                <th>Service Name</th>
                <th>Client Name</th>
                <th>Financial Year</th>
                <th>Due Date</th>
                <th>Days Left</th>
                <th>Service Delivery Status</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const client = clients.find(c => c.id === a.clientId);
                const service = services.find(s => s.id === a.serviceId);
                const subs = subServices.filter(ss => a.subServiceIds?.includes(ss.id));
                const serviceNameStr = (subs[0]?.name || (a as any).serviceName || "").toLowerCase();
                const subObj = subServices.find(ss => a.subServiceIds?.includes(ss.id)) 
                  || subServices.find(ss => serviceNameStr && ss.name.toLowerCase().includes(serviceNameStr.split(" ")[0]))
                  || DEFAULT_SUB_SERVICES.find(ss => a.subServiceIds?.includes(ss.id))
                  || DEFAULT_SUB_SERVICES.find(ss => serviceNameStr && ss.name.toLowerCase().includes(serviceNameStr.split(" ")[0]));

                let effectiveDueDateStr = a.dueDate;
                if (subObj) {
                  if (subObj.dueDateDay) {
                    const monthsList = subObj.applicableMonths && subObj.applicableMonths.length > 0 ? subObj.applicableMonths : ALL_MONTHS;
                    effectiveDueDateStr = getNextUpcomingDueDate(monthsList, subObj.dueDateDay);
                  } else if (subObj.dueDate) {
                    effectiveDueDateStr = subObj.dueDate;
                  }
                }

                const status = getDueStatus(effectiveDueDateStr);
                const deliveryStatus = (a.status as DeliveryStatus) || "PENDING";
                const cfg = statusConfig[deliveryStatus];
                const StatusIcon = cfg.icon;

                const isRed = status.category === "RED";
                const isYellow = status.category === "YELLOW";

                return (
                  <tr
                    key={a.id}
                    style={{
                      background: isRed ? "#FEF2F2" : isYellow ? "#FEFCE8" : "#FFFFFF",
                      borderLeft: isRed ? "4px solid #DC2626" : isYellow ? "4px solid #D97706" : "4px solid #059669"
                    }}
                  >
                    <td className="col-num">{i + 1}</td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {(() => {
                          const foundSubs = subServices.filter(ss => a.subServiceIds?.includes(ss.id));
                          if (foundSubs.length > 0) return foundSubs.map(ss => (<span key={ss.id} className="chip" style={{ background: "#EFF6FF", color: "#1D4ED8", fontWeight: 700, fontSize: 12 }}>{ss.name}</span>));
                          const defaultSubs = DEFAULT_SUB_SERVICES.filter(ss => a.subServiceIds?.includes(ss.id));
                          if (defaultSubs.length > 0) return defaultSubs.map(ss => (<span key={ss.id} className="chip" style={{ background: "#EFF6FF", color: "#1D4ED8", fontWeight: 700, fontSize: 12 }}>{ss.name}</span>));
                          const pkgName = service?.name || (a as any).serviceName || (a.subServiceIds && a.subServiceIds[0]) || "Service";
                          return (<span className="chip" style={{ background: "#EFF6FF", color: "#1D4ED8", fontWeight: 700, fontSize: 12 }}>{pkgName}</span>);
                        })()}
                      </div>
                    </td>
                    <td style={{ fontWeight: 800, color: "#0F172A" }}>{client?.name || "-"}</td>
                    <td><span className="badge" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>FY {a.financialYear}</span></td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Calendar size={13} color={isRed ? "#DC2626" : "#0176D3"} />
                        <span style={{ fontWeight: 800, color: isRed ? "#DC2626" : isYellow ? "#B45309" : "#0F172A", fontSize: 13 }}>
                          {effectiveDueDateStr ? formatDate(effectiveDueDateStr) : "-"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, fontSize: 12, color: isRed ? "#DC2626" : isYellow ? "#B45309" : "#059669", background: isRed ? "#FEE2E2" : isYellow ? "#FEF3C7" : "#DCFCE7", padding: "3px 8px", borderRadius: 12 }}>
                        {status.label}
                      </span>
                    </td>
                    <td>
                      {/* 3 inline status buttons — same as One Time Services */}
                      <div style={{ display: "flex", gap: 5 }}>
                        {(["PENDING", "IN_PROGRESS", "COMPLETED"] as DeliveryStatus[]).map(s => {
                          const scfg = statusConfig[s];
                          const isActive = deliveryStatus === s;
                          return (
                            <button
                              key={s}
                              onClick={() => { updateAssignedService({ ...a, status: s }); toast.success(`Status set to ${scfg.label}`); }}
                              style={{
                                padding: "4px 10px", borderRadius: 16, cursor: "pointer", fontSize: 11, fontWeight: 800,
                                background: isActive ? scfg.bg : "#F8FAFC",
                                color: isActive ? scfg.color : "#94A3B8",
                                border: isActive ? `2px solid ${scfg.color}` : "1px solid #E2E8F0",
                                transition: "all 0.15s",
                              }}
                            >
                              {scfg.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="col-actions">
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="icon-btn-slds" title="View Details" onClick={() => setViewDetailModal({ open: true, assignment: a })}><Eye size={14} color="#0176D3" /></button>
                        <button className="icon-btn-slds" title="Edit Assignment" onClick={() => openEdit(a)}><Pencil size={14} color="#64748B" /></button>
                        <button className="icon-btn-slds" title="Delete" onClick={() => { if (confirm("Delete this assigned package?")) deleteAssignedService(a.id); }}><Trash2 size={14} color="#DC2626" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#64748B" }}>
                    No assigned packages found. Click "+ Assign Package" to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Details */}
      {viewDetailModal.open && viewDetailModal.assignment && (
        <div className="modal-overlay" onClick={() => setViewDetailModal({ open: false, assignment: null })}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            {(() => {
              const assign = viewDetailModal.assignment;
              const client = clients.find(c => c.id === assign.clientId);
              const service = services.find(s => s.id === assign.serviceId);
              const subs = subServices.filter(ss => assign.subServiceIds?.includes(ss.id));
              const deliveryStatus = (assign.status as DeliveryStatus) || "PENDING";
              const cfg = statusConfig[deliveryStatus];
              const StatusIcon = cfg.icon;

              return (
                <>
                  <div className="modal-header">
                    <div className="modal-title">Assignment Details</div>
                    <button className="btn-slds btn-slds-secondary" style={{ padding: "4px 8px" }} onClick={() => setViewDetailModal({ open: false, assignment: null })}>✕</button>
                  </div>
                  <div className="modal-body" style={{ display: "grid", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>Client Name</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>{client?.name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>Package</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#0176D3" }}>{service?.name}</div>
                    </div>
                    {subs.length > 0 && (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>Services</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {subs.map(ss => (<span key={ss.id} className="chip" style={{ background: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>{ss.name}</span>))}
                        </div>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>Service Delivery Status</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 8, width: "fit-content" }}>
                        <StatusIcon size={16} color={cfg.color} />
                        <span style={{ fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                      </div>
                    </div>
                    <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <a href={getWhatsAppLink(client?.mobile || "", `Hello ${client?.name}, reminder for ${service?.name} due on ${formatDate(assign.dueDate || "")}.`)} target="_blank" rel="noreferrer" className="btn-slds btn-slds-success" style={{ padding: "6px 14px" }}>
                        <MessageCircle size={14} /><span>Send WhatsApp Reminder</span>
                      </a>
                      <button className="btn-slds btn-slds-secondary" onClick={() => setViewDetailModal({ open: false, assignment: null })}>Close</button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal: Assign Package */}
      {modal.open && (
        <div className="modal-overlay" onClick={() => setModal({ open: false, editing: null })}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modal.editing ? "Edit Assignment" : "Assign Package to Client"}</div>
              <button className="btn-slds btn-slds-secondary" style={{ padding: "4px 8px" }} onClick={() => setModal({ open: false, editing: null })}>✕</button>
            </div>
            <div className="modal-body" style={{ display: "grid", gap: 14 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>1. Client Name *</label>
                <select className="form-select" value={form.clientId} onChange={e => setForm((f: any) => ({ ...f, clientId: e.target.value }))}>
                  <option value="">Select client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>2. Package *</label>
                <select className="form-select" value={form.serviceId} onChange={e => {
                  const selectedSvcId = e.target.value;
                  const matchingSubs = subServices.filter(ss => ss.serviceId === selectedSvcId || (ss.serviceIds && ss.serviceIds.includes(selectedSvcId))).map(ss => ss.id);
                  setForm((f: any) => ({ ...f, serviceId: selectedSvcId, subServiceIds: matchingSubs }));
                }}>
                  <option value="">Select package</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>3. Select Services *</label>
                  <button type="button" className="btn-slds btn-slds-secondary" style={{ padding: "2px 8px", fontSize: 10 }} onClick={() => {
                    const allIds = availableSubServices.map(ss => ss.id);
                    const isAllSelected = allIds.every(id => (form.subServiceIds || []).includes(id));
                    setForm((f: any) => ({ ...f, subServiceIds: isAllSelected ? [] : allIds }));
                  }}>
                    {availableSubServices.every(ss => (form.subServiceIds || []).includes(ss.id)) ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4, padding: 10, background: "#F8FAFC", borderRadius: 8, border: "1px solid #CBD5E1" }}>
                  {availableSubServices.map(ss => {
                    const isSelected = (form.subServiceIds || []).includes(ss.id);
                    return (
                      <button
                        key={ss.id} type="button"
                        className={`btn-slds ${isSelected ? "btn-slds-primary" : "btn-slds-secondary"}`}
                        style={{ padding: "6px 12px", fontSize: 12, fontWeight: 700, background: isSelected ? "#0176D3" : "#FFFFFF", color: isSelected ? "#FFFFFF" : "#334155", border: isSelected ? "1px solid #0176D3" : "1px solid #CBD5E1" }}
                        onClick={() => toggleSubService(ss.id)}
                      >
                        {isSelected ? "✓ " : "+ "}{ss.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-slds btn-slds-secondary" onClick={() => setModal({ open: false, editing: null })}>Cancel</button>
              <button className="btn-slds btn-slds-primary" onClick={handleSave}>{modal.editing ? "Save Changes" : "Assign Package"}</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
