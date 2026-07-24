"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { getDaysUntilDue, formatDate, getWhatsAppLink, formatCurrency, getFYMonths } from "@/lib/utils";
import { format, isSameMonth } from "date-fns";
import { MessageCircle, Mail, Calendar, Edit2, Search, Bell, Send, CheckCircle2, AlertTriangle, Filter } from "lucide-react";
import { toast } from "sonner";
import { AssignedService } from "@/lib/types";

import PaymentAndDeliveryCell from "@/components/PaymentAndDeliveryCell";

export default function DueDatesPage() {
  const { assignedServices, clients, services, subServices, selectedFY, updateAssignedService } = useAppStore();
  const [search, setSearch] = useState("");
  const [filterWindow, setFilterWindow] = useState<"all" | "10_15_days" | "overdue">("all");
  const [editingItem, setEditingItem] = useState<AssignedService | null>(null);
  const [payModal, setPayModal] = useState<{ open: boolean; assignment: AssignedService | null; amountToRecord: number }>({
    open: false, assignment: null, amountToRecord: 0
  });

  const months = getFYMonths(selectedFY);

  // Filter & calculate days until due for assigned services
  const dueItems = useMemo(() => {
    return assignedServices
      .filter(a => a.financialYear === selectedFY && a.dueDate)
      .map(a => {
        const client = clients.find(c => c.id === a.clientId);
        const service = services.find(s => s.id === a.serviceId);
        const daysLeft = getDaysUntilDue(a.dueDate!);
        return { ...a, client, service, daysLeft };
      })
      .filter(item => {
        const matchesSearch = (item.client?.name || "").toLowerCase().includes(search.toLowerCase()) ||
                              (item.service?.name || "").toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filterWindow === "all" ||
                              (filterWindow === "10_15_days" && item.daysLeft >= 10 && item.daysLeft <= 15) ||
                              (filterWindow === "overdue" && item.daysLeft < 0);
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  }, [assignedServices, clients, services, selectedFY, search, filterWindow]);

  // Section 9: 10-15 Days Deadline Reminders
  const approaching10To15Days = useMemo(() => {
    return assignedServices
      .filter(a => a.financialYear === selectedFY && a.dueDate)
      .map(a => {
        const client = clients.find(c => c.id === a.clientId);
        const service = services.find(s => s.id === a.serviceId);
        const daysLeft = getDaysUntilDue(a.dueDate!);
        return { ...a, client, service, daysLeft };
      })
      .filter(item => item.daysLeft >= 10 && item.daysLeft <= 15);
  }, [assignedServices, clients, services, selectedFY]);

  const handleSendBatchReminders = () => {
    if (approaching10To15Days.length === 0) {
      toast.info("No compliance deadlines approaching in the 10–15 day window.");
      return;
    }
    toast.success(`Automated reminders dispatched for ${approaching10To15Days.length} clients in the 10–15 day deadline window!`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    updateAssignedService(editingItem);
    toast.success("Due Date and Billing Amount updated successfully!");
    setEditingItem(null);
  };

  return (
    <AppShell title="Due Date Grid" subtitle={`Manual due dates & free-text billing management for FY ${selectedFY}`}>

      {/* Main Due Date Grid Table with Section 6 Requirements */}
      <div className="data-table-wrapper" style={{ marginBottom: 24 }}>
        <div className="data-table-header">
          <div className="toolbar-controls">
            <div className="search-wrapper">
              <Search className="search-icon" />
              <input className="search-input" placeholder="Search by client or service..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                className={`btn-slds ${filterWindow === "all" ? "btn-slds-primary" : "btn-slds-secondary"}`}
                style={{ padding: "4px 10px", fontSize: 11 }}
                onClick={() => setFilterWindow("all")}
              >
                All Grid Items
              </button>
              <button
                className={`btn-slds ${filterWindow === "10_15_days" ? "btn-slds-primary" : "btn-slds-secondary"}`}
                style={{ padding: "4px 10px", fontSize: 11, background: filterWindow === "10_15_days" ? "#D97706" : undefined }}
                onClick={() => setFilterWindow("10_15_days")}
              >
                🟡 10–15 Days Left
              </button>
              <button
                className={`btn-slds ${filterWindow === "overdue" ? "btn-slds-primary" : "btn-slds-secondary"}`}
                style={{ padding: "4px 10px", fontSize: 11, background: filterWindow === "overdue" ? "#DC2626" : undefined }}
                onClick={() => setFilterWindow("overdue")}
              >
                🔴 Overdue Dues
              </button>
            </div>
          </div>
        </div>

        <div className="table-scroll-container">
          <table>
            <thead>
              <tr>
                <th className="col-num">#</th>
                <th>Client Name</th>
                <th>Main Service & Sub-Services</th>
                <th>Manual Due Date</th>
                <th>Payment & Service Delivery Status</th>
                <th>Status Proximity</th>
                <th className="col-right">Free-Text Amount Billed</th>
                <th className="col-right">Amount Received</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dueItems.map((item, i) => {
                const days = item.daysLeft;
                const isOverdue = days < 0;
                const isWarningWindow = days >= 10 && days <= 15;
                const assignedSubs = subServices.filter(ss => item.subServiceIds?.includes(ss.id));

                return (
                  <tr key={item.id}>
                    <td className="col-num">{i + 1}</td>
                    <td style={{ fontWeight: 800, color: "#0F172A" }}>{item.client?.name || "Client"}</td>
                    <td>
                      <div style={{ fontWeight: 800, color: "#0176D3" }}>{item.service?.name || "Main Service"}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                        {assignedSubs.map(ss => (
                          <span key={ss.id} className="chip" style={{ background: "#F1F5F9", color: "#334155", fontSize: 11 }}>
                            {ss.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: "#334155" }}>
                        <Calendar size={14} color="#0176D3" />
                        <span>{formatDate(item.dueDate!)}</span>
                      </div>
                    </td>
                    <td>
                      <PaymentAndDeliveryCell
                        amountBilled={item.amountBilled}
                        amountReceived={item.amountReceived}
                        deliveryStatus={item.status || "PENDING"}
                        onUpdateDeliveryStatus={(nextStatus) => {
                          updateAssignedService({ ...item, status: nextStatus });
                          toast.success(`Service Delivery updated to ${nextStatus === "COMPLETED" ? "Service Delivered" : nextStatus === "IN_PROGRESS" ? "In Progress" : "Not Started"}`);
                        }}
                        onRecordPayment={() => {
                          const remaining = Math.max(0, (item.amountBilled || 0) - (item.amountReceived || 0));
                          setPayModal({
                            open: true,
                            assignment: item,
                            amountToRecord: remaining > 0 ? remaining : 1000
                          });
                        }}
                      />
                    </td>
                    <td>
                      {isOverdue ? (
                        <span className="badge-slds badge-overdue" style={{ background: "#FEE2E2", color: "#991B1B" }}>
                          🔴 Overdue ({Math.abs(days)}d past)
                        </span>
                      ) : isWarningWindow ? (
                        <span className="badge-slds badge-pending" style={{ background: "#FEF3C7", color: "#92400E", fontWeight: 700 }}>
                          🟡 Approaching ({days}d left)
                        </span>
                      ) : (
                        <span className="badge-slds badge-active" style={{ background: "#DCFCE7", color: "#166534" }}>
                          🟢 On Schedule ({days}d left)
                        </span>
                      )}
                    </td>
                    {/* Section 6 requirement: Free-text manual entry field indicator */}
                    <td className="col-right" style={{ fontWeight: 800, color: "#059669" }}>
                      {formatCurrency(item.amountBilled)}
                    </td>
                    <td className="col-right" style={{ fontWeight: 600, color: "#D97706" }}>
                      {formatCurrency(item.amountReceived)}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn-slds btn-slds-secondary"
                          style={{ padding: "4px 8px", fontSize: 11 }}
                          onClick={() => setEditingItem(item)}
                          title="Edit Manual Due Date & Free-Text Amount"
                        >
                          <Edit2 size={12} />
                          <span>Edit Grid</span>
                        </button>

                        {item.client?.phone && (
                          <a
                            href={getWhatsAppLink(item.client.phone, `Reminder: ${item.service?.name} is due on ${formatDate(item.dueDate!)}.`)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-slds btn-slds-success"
                            style={{ padding: "4px 8px", fontSize: 11 }}
                            title="Send WhatsApp Reminder"
                          >
                            <MessageCircle size={12} />
                            <span>WA</span>
                          </a>
                        )}

                        {item.client?.email && (
                          <a
                            href={`mailto:${item.client.email}?subject=${encodeURIComponent(`Compliance Deadline Alert: ${item.service?.name}`)}&body=${encodeURIComponent(`Dear ${item.client.name},\n\nThis is an automated notice that your service deadline for ${item.service?.name} is due on ${formatDate(item.dueDate!)}.\nAmount Billed: ${formatCurrency(item.amountBilled)}.\n\nThank you!`)}`}
                            className="btn-slds btn-slds-secondary"
                            style={{ padding: "4px 8px", fontSize: 11, color: "#0284C7" }}
                            title="Send Email Reminder"
                          >
                            <Mail size={12} />
                            <span>Mail</span>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {dueItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-table-cell">
                    No compliance due dates matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 6 Quick Edit Modal: Manual Due Date + Free-Text Amount Entry Field */}
      {editingItem && (
        <div className="command-palette-backdrop" onClick={() => setEditingItem(null)}>
          <div className="command-palette-card" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "18px 24px", background: "#0F172A", color: "white", borderRadius: "16px 16px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Edit Due Date & Billing Grid</div>
              <button className="btn-slds btn-slds-secondary" style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "none" }} onClick={() => setEditingItem(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ padding: 24, display: "grid", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                  Client Account
                </label>
                <input
                  disabled
                  className="command-palette-input"
                  style={{ borderRadius: 8, background: "#F1F5F9", padding: 10, fontSize: 14 }}
                  value={clients.find(c => c.id === editingItem.clientId)?.name || ""}
                />
              </div>

              {/* Section 6 Requirement: Manual Due Date entry (date picker) */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                  Manual Due Date *
                </label>
                <input
                  type="date"
                  required
                  className="command-palette-input"
                  style={{ borderRadius: 8, border: "1px solid #CBD5E1", padding: 10, fontSize: 14 }}
                  value={editingItem.dueDate || ""}
                  onChange={e => setEditingItem({ ...editingItem, dueDate: e.target.value })}
                />
              </div>

              {/* Section 6 Requirement: Open free-text manual entry field for Amount */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                    Total Billing Amount (₹) [Free-Text Entry] *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    className="command-palette-input"
                    style={{ borderRadius: 8, border: "1px solid #CBD5E1", padding: 10, fontSize: 14 }}
                    placeholder="Type any amount e.g. 17500"
                    value={editingItem.amountBilled || ""}
                    onChange={e => {
                      const val = e.target.value;
                      const amountBilled = val === "" ? 0 : Number(val);
                      const amountReceived = editingItem.amountReceived || 0;
                      setEditingItem({
                        ...editingItem,
                        amountBilled,
                        amountPending: amountBilled - amountReceived
                      });
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                    Amount Received (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="command-palette-input"
                    style={{ borderRadius: 8, border: "1px solid #CBD5E1", padding: 10, fontSize: 14 }}
                    value={editingItem.amountReceived || ""}
                    onChange={e => {
                      const val = e.target.value;
                      const amountReceived = val === "" ? 0 : Number(val);
                      const amountBilled = editingItem.amountBilled || 0;
                      setEditingItem({
                        ...editingItem,
                        amountReceived,
                        amountPending: amountBilled - amountReceived
                      });
                    }}
                  />
                </div>
              </div>

              <div style={{ padding: 12, background: "#F8FAFC", borderRadius: 8, fontSize: 13, color: "#475569" }}>
                Pending Balance: <strong style={{ color: (editingItem.amountPending || 0) > 0 ? "#DC2626" : "#059669" }}>{formatCurrency(editingItem.amountPending || 0)}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" className="btn-slds btn-slds-secondary" onClick={() => setEditingItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-slds btn-slds-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Record Received Payment Modal */}
      {payModal.open && payModal.assignment && (
        <div className="command-palette-backdrop" onClick={() => setPayModal({ open: false, assignment: null, amountToRecord: 0 })}>
          <div className="command-palette-card" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "18px 24px", background: "#059669", color: "white", borderRadius: "16px 16px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800 }}>Record Received Payment</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>Log client payment entry for practice ledger</div>
              </div>
              <button className="btn-slds btn-slds-secondary" style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "none" }} onClick={() => setPayModal({ open: false, assignment: null, amountToRecord: 0 })}>✕</button>
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

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                      <button
                        className="btn-slds btn-slds-secondary"
                        onClick={() => setPayModal({ open: false, assignment: null, amountToRecord: 0 })}
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
                          setPayModal({ open: false, assignment: null, amountToRecord: 0 });
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

