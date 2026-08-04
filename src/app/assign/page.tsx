"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { AssignedService, SubService } from "@/lib/types";
import { Plus, Pencil, Trash2, Search, Eye, MessageCircle, Mail, AlertTriangle, CheckCircle2, Clock, Circle } from "lucide-react";
import { formatDate, getCurrentFY, getFYOptions, getWhatsAppLink } from "@/lib/utils";
import { toast } from "sonner";

type DeliveryStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

const statusConfig = {
  PENDING: { label: "Not Started", color: "#64748B", bg: "#F1F5F9", border: "#CBD5E1", icon: Circle },
  IN_PROGRESS: { label: "In Progress", color: "#D97706", bg: "#FFFBEB", border: "#FCD34D", icon: Clock },
  COMPLETED: { label: "Completed", color: "#059669", bg: "#F0FDF4", border: "#6EE7B7", icon: CheckCircle2 },
};

const empty = () => ({
  id: "", clientId: "", serviceId: "", subServiceIds: [],
  financialYear: getCurrentFY(), amountBilled: 0, amountReceived: 0, amountPending: 0, dueDate: new Date().toISOString().split("T")[0]
});

export default function AssignPage() {
  const { clients, services, subServices, assignedServices, selectedFY, addAssignedService, updateAssignedService, deleteAssignedService } = useAppStore();
  const [search, setSearch] = useState("");
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

    return list.sort((a, b) => {
      const daysA = getDueStatus(a.dueDate).days;
      const daysB = getDueStatus(b.dueDate).days;
      return daysA - daysB;
    });
  }, [assignedServices, clients, services, subServices, search, selectedFY]);

  const openAdd = () => { setForm(empty()); setModal({ open: true, editing: null }); };
  const openEdit = (a: AssignedService) => { setForm({ ...a }); setModal({ open: true, editing: a }); };

const DEFAULT_SUB_SERVICES: SubService[] = [
  { id: "ss_itr1", serviceId: "s1", name: "Income Tax Return (ITR-1/2/3/4)", recurrence: "ANNUALLY", dueDate: "2026-07-31" },
  { id: "ss_tax_audit", serviceId: "s1", name: "Tax Audit u/s 44AB", recurrence: "ANNUALLY", dueDate: "2026-09-30" },
  { id: "ss_adv_tax", serviceId: "s1", name: "Advance Tax Payment", recurrence: "QUARTERLY", dueDate: "2026-09-15" },
  { id: "ss_gstr3b", serviceId: "s2", name: "GSTR 3B Return", recurrence: "MONTHLY", dueDate: "2026-08-20" },
  { id: "ss_gstr1", serviceId: "s2", name: "GSTR 1 Return", recurrence: "MONTHLY", dueDate: "2026-08-11" },
  { id: "ss_gstr9", serviceId: "s2", name: "GSTR 9 Annual Return", recurrence: "ANNUALLY", dueDate: "2026-12-31" },
  { id: "ss_tds26q", serviceId: "s3", name: "TDS Return (26Q/27Q)", recurrence: "QUARTERLY", dueDate: "2026-07-31" },
  { id: "ss_roc_aoc4", serviceId: "s4", name: "ROC Annual Filing (AOC-4/MGT-7)", recurrence: "ANNUALLY", dueDate: "2026-10-30" },
];

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

    // Determine subservices to assign
    const targetSubIds = (form.subServiceIds && form.subServiceIds.length > 0)
      ? form.subServiceIds
      : availableSubServices.map(ss => ss.id);

    if (modal.editing) {
      const record: AssignedService = {
        ...form,
        id: form.id
      };
      updateAssignedService(record);
      toast.success("Assignment updated successfully!");
    } else {
      if (targetSubIds.length > 0) {
        // Create SEPARATE individual rows for each selected service
        targetSubIds.forEach((ssId: string, idx: number) => {
          const ssObj = subServices.find(s => s.id === ssId);
          // Calculate Due Date based on form.durationMonths or form.dueDate
          let calculatedDueDate = form.dueDate || new Date().toISOString().split("T")[0];
          if (form.durationMonths && form.durationMonths > 0) {
            const dt = new Date();
            dt.setMonth(dt.getMonth() + Number(form.durationMonths));
            calculatedDueDate = dt.toISOString().split("T")[0];
          }

          const newRecord: AssignedService = {
            id: `as_${Date.now()}_${idx}_${Math.random().toString(36).substring(2,6)}`,
            clientId: form.clientId,
            serviceId: form.serviceId || ssObj?.serviceId || "",
            subServiceIds: [ssId],
            financialYear: selectedFY || getCurrentFY(),
            amountBilled: 0,
            amountReceived: 0,
            amountPending: 0,
            status: "PENDING",
            dueDate: ssObj?.dueDate || calculatedDueDate
          };
          addAssignedService(newRecord);
        });
        toast.success(`Assigned ${targetSubIds.length} service(s) to client in separate rows!`);
      } else {
        // Fallback: Assign package directly if no subservices configured under package
        const pkgObj = services.find(s => s.id === form.serviceId);
        const newRecord: AssignedService = {
          id: `as_${Date.now()}_${Math.random().toString(36).substring(2,6)}`,
          clientId: form.clientId,
          serviceId: form.serviceId,
          subServiceIds: [],
          financialYear: selectedFY || getCurrentFY(),
          amountBilled: pkgObj?.price || 0,
          amountReceived: 0,
          amountPending: pkgObj?.price || 0,
          status: "PENDING",
          dueDate: new Date().toISOString().split("T")[0]
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

  const fyOptions = getFYOptions();

  return (
    <AppShell title="Assign Packages" subtitle="Assign packages to clients with due date tracking">
      <div className="data-table-wrapper">
        <div className="data-table-header">
          <div className="toolbar-controls">
            <div className="search-wrapper">
              <Search className="search-icon" />
              <input className="search-input" placeholder="Search client, package or service..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <button className="btn-slds btn-slds-primary" onClick={openAdd}><Plus size={15} /> Assign Package</button>
        </div>

        {/* Priority Alert Banner */}
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
                <th>Service Delivery Status</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const client = clients.find(c => c.id === a.clientId);
                const service = services.find(s => s.id === a.serviceId);
                const subs = subServices.filter(ss => a.subServiceIds?.includes(ss.id));
                const status = getDueStatus(a.dueDate);
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

                    {/* 1. Service Name */}
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {(() => {
                          const foundSubs = subServices.filter(ss => a.subServiceIds?.includes(ss.id));
                          if (foundSubs.length > 0) {
                            return foundSubs.map(ss => (
                              <span key={ss.id} className="chip" style={{ background: "#EFF6FF", color: "#1D4ED8", fontWeight: 700, fontSize: 12 }}>{ss.name}</span>
                            ));
                          }
                          const defaultSubs = DEFAULT_SUB_SERVICES.filter(ss => a.subServiceIds?.includes(ss.id));
                          if (defaultSubs.length > 0) {
                            return defaultSubs.map(ss => (
                              <span key={ss.id} className="chip" style={{ background: "#EFF6FF", color: "#1D4ED8", fontWeight: 700, fontSize: 12 }}>{ss.name}</span>
                            ));
                          }
                          const pkgName = service?.name || (a as any).serviceName || (a.subServiceIds && a.subServiceIds[0]) || "Service";
                          return (
                            <span className="chip" style={{ background: "#EFF6FF", color: "#1D4ED8", fontWeight: 700, fontSize: 12 }}>{pkgName}</span>
                          );
                        })()}
                      </div>
                    </td>

                    {/* 2. Client Name */}
                    <td style={{ fontWeight: 800, color: "#0F172A" }}>{client?.name || "-"}</td>

                    {/* 4. FY */}
                    <td><span className="badge" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>FY {a.financialYear}</span></td>

                    {/* 5. Due Date */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontWeight: 700, color: isRed ? "#DC2626" : isYellow ? "#B45309" : "#059669", fontSize: 13 }}>
                          {a.dueDate ? formatDate(a.dueDate) : "-"}
                        </span>
                        <span
                          className="badge-slds"
                          style={{
                            background: isRed ? "#DC2626" : isYellow ? "#F59E0B" : "#10B981",
                            color: "white",
                            fontWeight: 700,
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: 6,
                            width: "fit-content"
                          }}
                        >
                          {status.label}
                        </span>
                      </div>
                    </td>

                    {/* 6. Delivery Status — clickable to cycle */}
                    <td>
                      <button
                        onClick={() => handleStatusCycle(a)}
                        title="Click to update status"
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          border: `1px solid ${cfg.border}`,
                          background: cfg.bg,
                          color: cfg.color,
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          transition: "all 0.15s",
                        }}
                      >
                        <StatusIcon size={13} />
                        {cfg.label}
                      </button>
                    </td>

                    {/* 7. Actions */}
                    <td className="col-actions">
                      <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
                        <button
                          className="btn-slds btn-slds-primary"
                          style={{ padding: "4px 8px", fontSize: 11 }}
                          onClick={() => setViewDetailModal({ open: true, assignment: a })}
                          title="View Details"
                        >
                          <Eye size={13} />
                        </button>
                        {client?.phone && (
                          <a
                            href={getWhatsAppLink(client.phone, `Hello ${client.name}, this is a reminder for ${service?.name} due on ${formatDate(a.dueDate || "")}.`)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-slds btn-slds-success"
                            style={{ padding: "4px 8px", fontSize: 11 }}
                            title="WhatsApp"
                          >
                            <MessageCircle size={13} />
                          </a>
                        )}
                        {client?.email && (
                          <a
                            href={`mailto:${client.email}?subject=${encodeURIComponent(`Reminder: ${service?.name}`)}&body=${encodeURIComponent(`Dear ${client.name},\n\nThis is a reminder that ${service?.name} is due on ${formatDate(a.dueDate || "")}.\n\nThank you!`)}`}
                            className="btn-slds btn-slds-secondary"
                            style={{ padding: "4px 8px", fontSize: 11, color: "#0284C7" }}
                            title="Send Email"
                          >
                            <Mail size={13} />
                          </a>
                        )}
                        <button className="btn-slds btn-slds-secondary" style={{ padding: "4px 8px" }} onClick={() => openEdit(a)} title="Edit">
                          <Pencil size={13} />
                        </button>
                        <button className="btn-slds btn-slds-secondary" style={{ padding: "4px 8px", color: "#DC2626", borderColor: "#FCA5A5" }} onClick={() => { deleteAssignedService(a.id); toast.success("Removed"); }} title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-table-cell">
                    No assigned packages for FY {selectedFY}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Detail Modal */}
      {viewDetailModal.open && viewDetailModal.assignment && (
        <div className="command-palette-backdrop" onClick={() => setViewDetailModal({ open: false, assignment: null })}>
          <div className="command-palette-card" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            {(() => {
              const assign = viewDetailModal.assignment!;
              const client = clients.find(c => c.id === assign.clientId);
              const service = services.find(s => s.id === assign.serviceId);
              const subs = subServices.filter(ss => assign.subServiceIds?.includes(ss.id));
              const status = getDueStatus(assign.dueDate);
              const isRed = status.category === "RED";
              const deliveryStatus = (assign.status as DeliveryStatus) || "PENDING";
              const cfg = statusConfig[deliveryStatus];
              const StatusIcon = cfg.icon;

              return (
                <>
                  <div style={{ padding: "18px 24px", background: isRed ? "#7F1D1D" : "#0F172A", color: "white", borderRadius: "16px 16px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{client?.name || "Client Record"}</div>
                      <div style={{ fontSize: 12, color: "#94A3B8" }}>Assigned Package Details</div>
                    </div>
                    <button className="btn-slds btn-slds-secondary" style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "none" }} onClick={() => setViewDetailModal({ open: false, assignment: null })}>✕</button>
                  </div>

                  <div style={{ padding: 24, display: "grid", gap: 16 }}>
                    <div style={{ padding: 14, background: isRed ? "#FEF2F2" : "#F8FAFC", border: `1px solid ${isRed ? "#FCA5A5" : "#E2E8F0"}`, borderRadius: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Due Date Status</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: isRed ? "#DC2626" : "#059669", marginTop: 2 }}>
                        {assign.dueDate ? formatDate(assign.dueDate) : "No Due Date"} — {status.label}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Client</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>{client?.name}</div>
                        <div style={{ fontSize: 12, color: "#0176D3" }}>{client?.mobile || client?.phone}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Financial Year</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>FY {assign.financialYear}</div>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>Package</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#0176D3" }}>{service?.name}</div>
                    </div>

                    {subs.length > 0 && (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>Services</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {subs.map(ss => (
                            <span key={ss.id} className="chip" style={{ background: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>{ss.name}</span>
                          ))}
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
                      <a
                        href={getWhatsAppLink(client?.mobile || "", `Hello ${client?.name}, this is a reminder for ${service?.name} due on ${formatDate(assign.dueDate || "")}.`)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-slds btn-slds-success"
                        style={{ padding: "6px 14px" }}
                      >
                        <MessageCircle size={14} />
                        <span>Send WhatsApp Reminder</span>
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

      {/* Assign Package Modal */}
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

              {/* 3. Select Services Options (Always Visible) */}
              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>3. Select Services *</label>
                  <button
                    type="button"
                    className="btn-slds btn-slds-secondary"
                    style={{ padding: "2px 8px", fontSize: 10 }}
                    onClick={() => {
                      const allIds = availableSubServices.map(ss => ss.id);
                      const isAllSelected = allIds.every(id => (form.subServiceIds || []).includes(id));
                      setForm((f: any) => ({ ...f, subServiceIds: isAllSelected ? [] : allIds }));
                    }}
                  >
                    {availableSubServices.every(ss => (form.subServiceIds || []).includes(ss.id)) ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4, padding: 10, background: "#F8FAFC", borderRadius: 8, border: "1px solid #CBD5E1" }}>
                  {availableSubServices.map(ss => {
                    const isSelected = (form.subServiceIds || []).includes(ss.id);
                    return (
                      <button
                        key={ss.id}
                        type="button"
                        className={`btn-slds ${isSelected ? "btn-slds-primary" : "btn-slds-secondary"}`}
                        style={{
                          padding: "6px 12px",
                          fontSize: 12,
                          fontWeight: 700,
                          background: isSelected ? "#0176D3" : "#FFFFFF",
                          color: isSelected ? "#FFFFFF" : "#334155",
                          border: isSelected ? "1px solid #0176D3" : "1px solid #CBD5E1"
                        }}
                        onClick={() => toggleSubService(ss.id)}
                      >
                        {isSelected ? "✓ " : "+ "}{ss.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Service Duration / Number of Months & Due Date */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>4. Duration (Months) *</label>
                  <select
                    className="form-select"
                    value={form.durationMonths || 1}
                    onChange={e => {
                      const months = Number(e.target.value);
                      const dt = new Date();
                      dt.setMonth(dt.getMonth() + months);
                      const computedStr = dt.toISOString().split("T")[0];
                      setForm((f: any) => ({ ...f, durationMonths: months, dueDate: computedStr }));
                    }}
                  >
                    <option value={1}>1 Month (Monthly)</option>
                    <option value={3}>3 Months (Quarterly)</option>
                    <option value={6}>6 Months (Half-Yearly)</option>
                    <option value={12}>12 Months (1 Year / Annual)</option>
                    <option value={24}>24 Months (2 Years)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Due Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={form.dueDate || new Date().toISOString().split("T")[0]}
                    onChange={e => setForm((f: any) => ({ ...f, dueDate: e.target.value }))}
                  />
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
