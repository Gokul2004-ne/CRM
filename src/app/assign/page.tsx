"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { AssignedService, Client, Service } from "@/lib/types";
import { Plus, Pencil, Trash2, Search, Eye, MessageCircle, Mail, AlertTriangle, CheckCircle2, Sparkles, Calendar } from "lucide-react";
import { formatCurrency, formatDate, getCurrentFY, getFYOptions, getWhatsAppLink } from "@/lib/utils";
import { toast } from "sonner";

import PaymentAndDeliveryCell from "@/components/PaymentAndDeliveryCell";

const empty = (): Omit<AssignedService, "amountPending"> & { amountPending?: number } => ({
  id: "", clientId: "", serviceId: "", subServiceIds: [],
  financialYear: getCurrentFY(), amountBilled: 0, amountReceived: 0, dueDate: new Date().toISOString().split("T")[0]
});

export default function AssignPage() {
  const { clients, services, subServices, assignedServices, selectedFY, addAssignedService, updateAssignedService, deleteAssignedService } = useAppStore();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ open: boolean; editing: AssignedService | null }>({ open: false, editing: null });
  const [viewDetailModal, setViewDetailModal] = useState<{ open: boolean; assignment: AssignedService | null }>({ open: false, assignment: null });
  const [payModal, setPayModal] = useState<{ open: boolean; assignment: AssignedService | null; amountToRecord: number; paymentMode: string }>({
    open: false, assignment: null, amountToRecord: 0, paymentMode: "Bank Transfer"
  });
  const [form, setForm] = useState<any>(empty());

  // Helper to calculate days remaining until Due Date
  const getDueStatus = (dueDateStr?: string) => {
    if (!dueDateStr) return { days: 999, category: "GREEN" as const, label: "On Schedule" };
    const due = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    due.setHours(0,0,0,0);
    const diffTime = due.getTime() - today.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (days <= 0) return { days, category: "RED" as const, label: days === 0 ? "Due Today!" : `${Math.abs(days)} Days Overdue` };
    if (days <= 9) return { days, category: "RED" as const, label: `Due in ${days} Days (Critical)` };
    if (days <= 15) return { days, category: "YELLOW" as const, label: `Due in ${days} Days` };
    return { days, category: "GREEN" as const, label: `Due in ${days} Days` };
  };

  // Filter and auto-sort due dates so RED / closest due dates automatically float to the top
  const filtered = useMemo(() => {
    const list = assignedServices
      .filter(a => a.financialYear === selectedFY)
      .filter(a => {
        const client = clients.find(c => c.id === a.clientId);
        const service = services.find(s => s.id === a.serviceId);
        return (client?.name || "").toLowerCase().includes(search.toLowerCase()) ||
               (service?.name || "").toLowerCase().includes(search.toLowerCase());
      });

    // Sort by Due Date proximity: Critical/Red (nearest/overdue) FIRST on top
    return list.sort((a, b) => {
      const daysA = getDueStatus(a.dueDate).days;
      const daysB = getDueStatus(b.dueDate).days;
      return daysA - daysB;
    });
  }, [assignedServices, clients, services, search, selectedFY]);

  const openAdd = () => { setForm(empty()); setModal({ open: true, editing: null }); };
  const openEdit = (a: AssignedService) => { setForm({ ...a }); setModal({ open: true, editing: a }); };

  const availableSubServices = useMemo(() =>
    subServices.filter(ss => ss.serviceId === form.serviceId || (ss.serviceIds && ss.serviceIds.includes(form.serviceId))), [subServices, form.serviceId]);

  const handleSave = () => {
    if (!form.clientId || !form.serviceId || !form.dueDate) {
      toast.error("Client, Service, and Due Date are required");
      return;
    }
    const record: AssignedService = {
      ...form,
      amountBilled: form.amountBilled || 0,
      amountReceived: form.amountReceived || 0,
      amountPending: (form.amountBilled || 0) - (form.amountReceived || 0),
      id: form.id || `as${Date.now()}`
    };
    if (modal.editing) { updateAssignedService(record); toast.success("Assignment updated"); }
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
    <AppShell title="Assign Services" subtitle={`Capture assignment details with automatic due-date priority triggers`}>
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

        {/* Priority Banner for Near Due Dates */}
        <div style={{ padding: "10px 16px", background: "#FEF2F2", borderBottom: "1px solid #FECACA", display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#991B1B", fontWeight: 700 }}>
          <AlertTriangle size={16} color="#DC2626" />
          <span>Priority Alert: Approaching / Overdue Service Due Dates are automatically highlighted RED on top.</span>
        </div>

        <div className="table-scroll-container">
          <table>
            <thead>
              <tr>
                <th className="col-num">#</th>
                <th>Client Name</th>
                <th>Service</th>
                <th>Sub Services</th>
                <th>Financial Year</th>
                <th>Due Date & Trigger Status</th>
                <th>Payment & Service Delivery Status</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const client = clients.find(c => c.id === a.clientId);
                const service = services.find(s => s.id === a.serviceId);
                const subs = subServices.filter(ss => a.subServiceIds.includes(ss.id));
                const status = getDueStatus(a.dueDate);

                const isRed = status.category === "RED";
                const isYellow = status.category === "YELLOW";

                return (
                  <tr
                    key={a.id}
                    style={{
                      background: isRed ? "#FEF2F2" : isYellow ? "#FEFCE8" : "#FFFFFF",
                      borderLeft: isRed ? "5px solid #DC2626" : isYellow ? "5px solid #D97706" : "5px solid #059669"
                    }}
                  >
                    <td className="col-num">{i + 1}</td>
                    <td style={{ fontWeight: 800, color: "#0F172A" }}>{client?.name || "-"}</td>
                    <td style={{ fontWeight: 600 }}>{service?.name || "-"}</td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {subs.map(ss => <span key={ss.id} className="chip" style={{ background: "white", border: "1px solid #CBD5E1" }}>{ss.name}</span>)}
                      </div>
                    </td>
                    <td><span className="badge" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>FY {a.financialYear}</span></td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, color: isRed ? "#DC2626" : isYellow ? "#B45309" : "#059669" }}>
                          {a.dueDate ? formatDate(a.dueDate) : "-"}
                        </span>
                        <span
                          className="badge-slds"
                          style={{
                            background: isRed ? "#DC2626" : isYellow ? "#F59E0B" : "#10B981",
                            color: "white",
                            fontWeight: 800,
                            fontSize: 11
                          }}
                        >
                          {status.label}
                        </span>
                      </div>
                    </td>
                    <td>
                      <PaymentAndDeliveryCell
                        amountBilled={a.amountBilled}
                        amountReceived={a.amountReceived}
                        deliveryStatus={a.status || "PENDING"}
                        onUpdateDeliveryStatus={(nextStatus) => {
                          updateAssignedService({ ...a, status: nextStatus });
                          toast.success(`Service Delivery Status updated to ${nextStatus === "COMPLETED" ? "Service Delivered" : nextStatus === "IN_PROGRESS" ? "In Progress" : "Not Started"}`);
                        }}
                        onRecordPayment={() => {
                          const remaining = Math.max(0, (a.amountBilled || 0) - (a.amountReceived || 0));
                          setPayModal({
                            open: true,
                            assignment: a,
                            amountToRecord: remaining > 0 ? remaining : 1000,
                            paymentMode: "Bank Transfer"
                          });
                        }}
                      />
                    </td>
                    <td className="col-actions">
                      <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                        {/* View Option for Assigned Service */}
                        <button
                          className="btn-slds btn-slds-primary"
                          style={{ padding: "4px 10px", fontSize: 11 }}
                          onClick={() => setViewDetailModal({ open: true, assignment: a })}
                          title="View Assigned Service Details"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
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
                  <td colSpan={7} className="empty-table-cell">
                    No assigned services for FY {selectedFY}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Option Modal for Assigned Service */}
      {viewDetailModal.open && viewDetailModal.assignment && (
        <div className="command-palette-backdrop" onClick={() => setViewDetailModal({ open: false, assignment: null })}>
          <div className="command-palette-card" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            {(() => {
              const assign = viewDetailModal.assignment;
              const client = clients.find(c => c.id === assign.clientId);
              const service = services.find(s => s.id === assign.serviceId);
              const subs = subServices.filter(ss => assign.subServiceIds.includes(ss.id));
              const status = getDueStatus(assign.dueDate);
              const isRed = status.category === "RED";

              return (
                <>
                  <div style={{ padding: "18px 24px", background: isRed ? "#7F1D1D" : "#0F172A", color: "white", borderRadius: "16px 16px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{client?.name || "Client Service Record"}</div>
                      <div style={{ fontSize: 12, color: "#94A3B8" }}>Assigned Compliance Service Details</div>
                    </div>
                    <button className="btn-slds btn-slds-secondary" style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "none" }} onClick={() => setViewDetailModal({ open: false, assignment: null })}>
                      ✕
                    </button>
                  </div>

                  <div style={{ padding: 24, display: "grid", gap: 16 }}>
                    <div style={{ padding: 14, background: isRed ? "#FEF2F2" : "#F8FAFC", border: `1px solid ${isRed ? "#FCA5A5" : "#E2E8F0"}`, borderRadius: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Due Date Trigger Status</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: isRed ? "#DC2626" : "#059669", marginTop: 2 }}>
                        {assign.dueDate ? formatDate(assign.dueDate) : "No Due Date"} — {status.label}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Client Name</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>{client?.name}</div>
                        <div style={{ fontSize: 12, color: "#0176D3" }}>{client?.mobile || client?.phone}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Financial Year</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>FY {assign.financialYear}</div>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>Main Service</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#0176D3" }}>{service?.name}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>Sub Services Included</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {subs.map(ss => (
                          <span key={ss.id} className="chip" style={{ background: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}>
                            {ss.name}
                          </span>
                        ))}
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

                      <button className="btn-slds btn-slds-secondary" onClick={() => setViewDetailModal({ open: false, assignment: null })}>
                        Close
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Assign Service Modal (Capturing ONLY 5 Fields: Client, Service, Sub-Service, Year, Due Date) */}
      {modal.open && (
        <div className="modal-overlay" onClick={() => setModal({ open: false, editing: null })}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modal.editing ? "Edit Assignment" : "Assign Service to Client"}</div>
              <button className="btn-slds btn-slds-secondary" style={{ padding: "4px 8px" }} onClick={() => setModal({ open: false, editing: null })}>✕</button>
            </div>
            <div className="modal-body" style={{ display: "grid", gap: 14 }}>
              {/* Field 1: Client Name */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>1. Client Name *</label>
                <select className="form-select" value={form.clientId} onChange={e => setForm((f: any) => ({ ...f, clientId: e.target.value }))}>
                  <option value="">Select client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Field 2: Service */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>2. Service *</label>
                <select className="form-select" value={form.serviceId} onChange={e => {
                  const selectedSvcId = e.target.value;
                  const matchingSubs = subServices.filter(ss => ss.serviceId === selectedSvcId || (ss.serviceIds && ss.serviceIds.includes(selectedSvcId))).map(ss => ss.id);
                  setForm((f: any) => ({ ...f, serviceId: selectedSvcId, subServiceIds: matchingSubs }));
                }}>
                  <option value="">Select service</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Field 3: Sub-Service */}
              {availableSubServices.length > 0 && (
                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>3. Sub-Service</label>
                    <button
                      type="button"
                      className="btn-slds btn-slds-secondary"
                      style={{ padding: "2px 8px", fontSize: 10 }}
                      onClick={() => {
                        const allIds = availableSubServices.map(ss => ss.id);
                        const isAllSelected = allIds.every(id => form.subServiceIds.includes(id));
                        setForm((f: any) => ({ ...f, subServiceIds: isAllSelected ? [] : allIds }));
                      }}
                    >
                      {availableSubServices.every(ss => form.subServiceIds.includes(ss.id)) ? "Deselect All" : "Select All"}
                    </button>
                  </div>
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {/* Field 4: Year */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>4. Year (Financial Year) *</label>
                  <select className="form-select" value={form.financialYear} onChange={e => setForm((f: any) => ({ ...f, financialYear: e.target.value }))}>
                    {fyOptions.map(fy => <option key={fy} value={fy}>FY {fy}</option>)}
                  </select>
                </div>

                {/* Field 5: Due Date */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>5. Due Date *</label>
                  <input className="form-input" type="date" value={form.dueDate} onChange={e => setForm((f: any) => ({ ...f, dueDate: e.target.value }))} />
                </div>
              </div>

              {/* Billing / Amount Received Fields */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, paddingTop: 10, borderTop: "1px dashed #CBD5E1" }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Total Billed Amount (₹)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={form.amountBilled || ""}
                    onChange={e => {
                      const val = e.target.value;
                      setForm((f: any) => ({ ...f, amountBilled: val === "" ? 0 : Number(val) }));
                    }}
                    placeholder="e.g. 12000"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Amount Received (₹)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={form.amountReceived || ""}
                    onChange={e => {
                      const val = e.target.value;
                      setForm((f: any) => ({ ...f, amountReceived: val === "" ? 0 : Number(val) }));
                    }}
                    placeholder="e.g. 8000"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-slds btn-slds-secondary" onClick={() => setModal({ open: false, editing: null })}>Cancel</button>
              <button className="btn-slds btn-slds-primary" onClick={handleSave}>{modal.editing ? "Save Changes" : "Assign Service"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Record Received Payment Modal (Quick 1-Click Payment Entry) */}
      {payModal.open && payModal.assignment && (
        <div className="command-palette-backdrop" onClick={() => setPayModal({ open: false, assignment: null, amountToRecord: 0, paymentMode: "Bank Transfer" })}>
          <div className="command-palette-card" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "18px 24px", background: "#059669", color: "white", borderRadius: "16px 16px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800 }}>Record Received Payment</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>Log client payment entry for practice ledger</div>
              </div>
              <button className="btn-slds btn-slds-secondary" style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "none" }} onClick={() => setPayModal({ open: false, assignment: null, amountToRecord: 0, paymentMode: "Bank Transfer" })}>✕</button>
            </div>

            <div style={{ padding: 24, display: "grid", gap: 14 }}>
              {(() => {
                const a = payModal.assignment;
                const client = clients.find(c => c.id === a.clientId);
                const service = services.find(s => s.id === a.serviceId);
                const currentReceived = a.amountReceived || 0;
                const totalBilled = a.amountBilled || 0;
                const remaining = Math.max(0, totalBilled - currentReceived);

                return (
                  <>
                    <div style={{ padding: 12, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#166534" }}>Client: {client?.name}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>Service: {service?.name}</div>
                      <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                        Already Received: <strong>{formatCurrency(currentReceived)}</strong> / Billed: <strong>{formatCurrency(totalBilled)}</strong> (Remaining Dues: <strong>{formatCurrency(remaining)}</strong>)
                      </div>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontWeight: 700 }}>
                        Payment Amount Received Now (₹) *
                      </label>
                      <input
                        className="form-input"
                        type="number"
                        min={1}
                        value={payModal.amountToRecord || ""}
                        onChange={e => {
                          const val = e.target.value;
                          setPayModal(p => ({ ...p, amountToRecord: val === "" ? 0 : Number(val) }));
                        }}
                        placeholder="Enter payment amount received..."
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontWeight: 700 }}>
                        Payment Method / Channel
                      </label>
                      <select
                        className="form-select"
                        value={payModal.paymentMode}
                        onChange={e => setPayModal(p => ({ ...p, paymentMode: e.target.value }))}
                      >
                        <option value="Bank Transfer">Bank Transfer / NEFT / RTGS</option>
                        <option value="UPI / QR Code">UPI (GPay / PhonePe / Paytm)</option>
                        <option value="Cash">Cash Payment</option>
                        <option value="Cheque">Cheque Deposit</option>
                      </select>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                      <button
                        className="btn-slds btn-slds-secondary"
                        onClick={() => setPayModal({ open: false, assignment: null, amountToRecord: 0, paymentMode: "Bank Transfer" })}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn-slds btn-slds-success"
                        onClick={() => {
                          const newTotalReceived = currentReceived + payModal.amountToRecord;
                          const newPending = Math.max(0, totalBilled - newTotalReceived);
                          updateAssignedService({
                            ...a,
                            amountReceived: newTotalReceived,
                            amountPending: newPending
                          });
                          toast.success(`🎉 Recorded ${formatCurrency(payModal.amountToRecord)} payment for ${client?.name}!`);
                          setPayModal({ open: false, assignment: null, amountToRecord: 0, paymentMode: "Bank Transfer" });
                        }}
                      >
                        Record Payment
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
