"use client";

import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { RenewalItem, ProgressStatus } from "@/lib/types";
import {
  Plus, Pencil, Trash2, Search, Eye, Calendar, RefreshCw, MessageCircle,
  Clock, Circle, CheckCircle2, Layers, AlertCircle, Sparkles
} from "lucide-react";
import { formatDate, getWhatsAppLink } from "@/lib/utils";
import { toast } from "sonner";

const progressStatusConfig: Record<ProgressStatus, { label: string; color: string; bg: string; border: string }> = {
  "To-do": { label: "To-do", color: "#475569", bg: "#F1F5F9", border: "#CBD5E1" },
  "In-progress": { label: "In-progress", color: "#D97706", bg: "#FFFBEB", border: "#FCD34D" },
  "Completed": { label: "Completed", color: "#059669", bg: "#F0FDF4", border: "#6EE7B7" },
};

const RECURRENCE_PRESETS = [
  "1 Year (Annual)",
  "2 Years",
  "3 Years",
  "5 Years",
  "Monthly",
  "Quarterly",
  "Custom Period"
];

const SUGGESTED_RENEWALS = [
  "GST Registration Renewal",
  "Trademark Renewal (10 Yrs)",
  "FSSAI Food License Renewal",
  "Import Export Code (IEC) Renewal",
  "Shop & Establishment License Renewal",
  "ISO Certification Renewal (3 Yrs)",
  "ROC Annual Compliance Renewal",
  "PF & ESI Registration Renewal",
  "Digital Signature (DSC) Renewal (2 Yrs)",
  "Accounting & Bookkeeping Retainer"
];

const emptyRenewal = (): Partial<RenewalItem> => {
  const today = new Date().toISOString().split("T")[0];
  const nextYearDate = new Date();
  nextYearDate.setFullYear(nextYearDate.getFullYear() + 1);
  const nextYearStr = nextYearDate.toISOString().split("T")[0];
  const currentYear = new Date().getFullYear();

  return {
    id: "",
    clientName: "",
    serviceName: "",
    registrationDate: "",
    fromDate: today,
    toDate: nextYearStr,
    dueDate: nextYearStr,
    financialYear: `FY ${currentYear}-${String(currentYear + 1).slice(-2)}`,
    recurrencePeriod: "1 Year (Annual)",
    progress: "To-do",
    notes: ""
  };
};

export default function RenewalsPage() {
  const { clients, renewals, addRenewal, updateRenewal, deleteRenewal, renewService } = useAppStore();

  const [search, setSearch] = useState("");
  const [progressTab, setProgressTab] = useState<ProgressStatus | "ALL">("ALL");
  const [modal, setModal] = useState<{ open: boolean; editing: RenewalItem | null }>({ open: false, editing: null });
  const [viewModal, setViewModal] = useState<{ open: boolean; item: RenewalItem | null }>({ open: false, item: null });
  const [form, setForm] = useState<Partial<RenewalItem>>(emptyRenewal());

  // Auto-calculate Financial Year & Due Date when From/To dates change
  const handleDateChange = (field: "fromDate" | "toDate" | "registrationDate" | "dueDate", value: string) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };

      if (field === "toDate" && value) {
        updated.dueDate = value; // Default Due Date to To Date
      }

      if (updated.fromDate && updated.toDate) {
        const y1 = new Date(updated.fromDate).getFullYear();
        const y2 = new Date(updated.toDate).getFullYear();
        if (!isNaN(y1) && !isNaN(y2)) {
          updated.financialYear = y1 === y2 ? `FY ${y1}` : `${y1} - ${y2}`;
        }
      }

      return updated;
    });
  };

  // Handle Recurrence change to auto-set To Date & FY
  const handleRecurrenceChange = (period: string) => {
    setForm(prev => {
      let years = 1;
      if (period.includes("2 Year")) years = 2;
      else if (period.includes("3 Year")) years = 3;
      else if (period.includes("5 Year")) years = 5;

      const fromD = prev.fromDate ? new Date(prev.fromDate) : new Date();
      const toD = new Date(fromD);
      toD.setFullYear(toD.getFullYear() + years);
      const toDateStr = toD.toISOString().split("T")[0];

      const y1 = fromD.getFullYear();
      const y2 = toD.getFullYear();
      const fyStr = y1 === y2 ? `FY ${y1}` : `${y1} - ${y2}`;

      return {
        ...prev,
        recurrencePeriod: period,
        toDate: toDateStr,
        dueDate: toDateStr,
        financialYear: fyStr
      };
    });
  };

  // Filter & Sort Renewals
  const filteredRenewals = useMemo(() => {
    const list = (renewals || []).filter(rn => {
      const q = search.toLowerCase();
      const matchesSearch = (rn.clientName || "").toLowerCase().includes(q) ||
                            (rn.serviceName || "").toLowerCase().includes(q) ||
                            (rn.financialYear || "").toLowerCase().includes(q);
      const matchesTab = progressTab === "ALL" || rn.progress === progressTab;
      return matchesSearch && matchesTab;
    });

    return list.sort((a, b) => {
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      return (a.clientName || "").localeCompare(b.clientName || "");
    });
  }, [renewals, search, progressTab]);

  const openAdd = () => {
    setForm(emptyRenewal());
    setModal({ open: true, editing: null });
  };

  const openEdit = (rn: RenewalItem) => {
    setForm({ ...rn });
    setModal({ open: true, editing: rn });
  };

  const handleSave = () => {
    if (!form.clientName?.trim()) {
      toast.error("Please enter Client Name");
      return;
    }
    if (!form.serviceName?.trim()) {
      toast.error("Please enter Service Name");
      return;
    }

    if (modal.editing) {
      updateRenewal(form as RenewalItem);
      toast.success(`🎉 Renewal for "${form.clientName}" updated successfully!`);
    } else {
      const newRecord: RenewalItem = {
        ...(form as RenewalItem),
        id: `rn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        progress: form.progress || "To-do",
        createdAt: new Date().toISOString()
      };
      addRenewal(newRecord);
      toast.success(`🎉 Renewal for "${form.clientName}" created successfully!`);
    }
    setModal({ open: false, editing: null });
  };

  const handleStatusChange = (rn: RenewalItem, nextStatus: ProgressStatus) => {
    updateRenewal({ ...rn, progress: nextStatus });
    toast.success(`Progress updated to "${nextStatus}"`);
  };

  const handleRenewAction = (rn: RenewalItem) => {
    if (confirm(`Renew service "${rn.serviceName}" for client "${rn.clientName}" for the next cycle?`)) {
      renewService(rn.id);
      toast.success(`🎉 Service "${rn.serviceName}" renewed for next cycle!`);
    }
  };

  const progressCounts = useMemo(() => {
    const all = renewals || [];
    return {
      ALL: all.length,
      "To-do": all.filter(o => o.progress === "To-do").length,
      "In-progress": all.filter(o => o.progress === "In-progress").length,
      Completed: all.filter(o => o.progress === "Completed").length,
    };
  }, [renewals]);

  return (
    <AppShell title="Renewals Management" subtitle="Track client service renewals, validity periods, and multi-year expiry dates">
      {/* ─── SUMMARY KPI CARDS ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 20 }}>
        <div className="card-slds" style={{ padding: 18, background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#64748B" }}>Total Renewals</span>
            <div style={{ padding: 8, background: "#EEF2FF", borderRadius: 10, color: "#4F46E5" }}><RefreshCw size={18} /></div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", marginTop: 8 }}>{progressCounts.ALL}</div>
          <div style={{ fontSize: 12, color: "#4F46E5", marginTop: 4, fontWeight: 600 }}>Active Renewal Trackers</div>
        </div>

        <div className="card-slds" style={{ padding: 18, background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#64748B" }}>To-do / Due</span>
            <div style={{ padding: 8, background: "#F1F5F9", borderRadius: 10, color: "#475569" }}><Clock size={18} /></div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", marginTop: 8 }}>{progressCounts["To-do"]}</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 4, fontWeight: 600 }}>Pending Renewals</div>
        </div>

        <div className="card-slds" style={{ padding: 18, background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#64748B" }}>In Progress</span>
            <div style={{ padding: 8, background: "#FFFBEB", borderRadius: 10, color: "#D97706" }}><Sparkles size={18} /></div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", marginTop: 8 }}>{progressCounts["In-progress"]}</div>
          <div style={{ fontSize: 12, color: "#D97706", marginTop: 4, fontWeight: 600 }}>Under Processing</div>
        </div>

        <div className="card-slds" style={{ padding: 18, background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#64748B" }}>Completed</span>
            <div style={{ padding: 8, background: "#F0FDF4", borderRadius: 10, color: "#059669" }}><CheckCircle2 size={18} /></div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", marginTop: 8 }}>{progressCounts.Completed}</div>
          <div style={{ fontSize: 12, color: "#059669", marginTop: 4, fontWeight: 600 }}>Renewed &amp; Updated</div>
        </div>
      </div>

      {/* ─── DATA TABLE TOOLBAR ─── */}
      <div className="data-table-wrapper">
        <div className="data-table-header" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12 }}>
          <div className="toolbar-controls" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div className="search-wrapper" style={{ width: 260 }}>
              <Search className="search-icon" />
              <input
                className="search-input"
                placeholder="Search Client, Service or FY..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Progress Status Filter Tabs */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["ALL", "To-do", "In-progress", "Completed"] as const).map(tab => {
                const cfg = tab === "ALL"
                  ? { color: "#4F46E5", bg: "#EEF2FF", border: "#6366F1" }
                  : progressStatusConfig[tab as ProgressStatus];
                const isActive = progressTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setProgressTab(tab)}
                    style={{
                      padding: "5px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 800,
                      background: isActive ? cfg.bg : "#F8FAFC",
                      color: isActive ? cfg.color : "#64748B",
                      border: isActive ? `2px solid ${cfg.color}` : "1px solid #CBD5E1",
                      transition: "all 0.15s",
                    }}
                  >
                    {tab} ({progressCounts[tab]})
                  </button>
                );
              })}
            </div>
          </div>

          <button
            className="btn-slds btn-slds-primary"
            style={{ background: "#4F46E5", border: "none", display: "flex", alignItems: "center", gap: 6 }}
            onClick={openAdd}
          >
            <Plus size={15} /> Add Renewal Service
          </button>
        </div>

        {/* ─── TABLE CONTENT ─── */}
        <div className="table-scroll-container">
          <table>
            <thead>
              <tr>
                <th className="col-num">#</th>
                <th>Client Name</th>
                <th>Service Name</th>
                <th>Registration Date (Optional)</th>
                <th>Date &amp; Financial Year</th>
                <th>Due Date &amp; Year</th>
                <th style={{ textAlign: "center" }}>Progress Status</th>
                <th className="col-actions" style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRenewals.map((rn, idx) => {
                const clientObj = clients.find(c => c.name.toLowerCase() === rn.clientName.toLowerCase());
                const phone = clientObj?.phone || clientObj?.mobile || "";

                // Year extraction from Due Date
                const dueYear = rn.dueDate ? new Date(rn.dueDate).getFullYear() : null;

                return (
                  <tr key={rn.id}>
                    <td className="col-num">{idx + 1}</td>

                    {/* Client Name */}
                    <td style={{ fontWeight: 800, color: "#0F172A", fontSize: 13 }}>
                      {rn.clientName}
                      {phone && <div style={{ fontSize: 11, color: "#0284C7", marginTop: 2 }}>{phone}</div>}
                    </td>

                    {/* Service Name */}
                    <td style={{ fontWeight: 800, color: "#4F46E5", fontSize: 13 }}>
                      {rn.serviceName}
                      {rn.recurrencePeriod && (
                        <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{rn.recurrencePeriod}</div>
                      )}
                    </td>

                    {/* Registration Date (Optional) */}
                    <td>
                      {rn.registrationDate ? (
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                          {formatDate(rn.registrationDate)}
                        </span>
                      ) : (
                        <span style={{ color: "#94A3B8", fontSize: 11 }}>-</span>
                      )}
                    </td>

                    {/* Date & Financial Year (From - To) */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <span className="badge" style={{ background: "#EFF6FF", color: "#1D4ED8", fontWeight: 800, fontSize: 11, width: "fit-content" }}>
                          {rn.financialYear || "FY 2026-27"}
                        </span>
                        {(rn.fromDate || rn.toDate) && (
                          <div style={{ fontSize: 11, color: "#64748B" }}>
                            {rn.fromDate ? formatDate(rn.fromDate) : "?"} to {rn.toDate ? formatDate(rn.toDate) : "?"}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Due Date & Year */}
                    <td>
                      {rn.dueDate ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Calendar size={14} color="#0284C7" />
                          <div>
                            <div style={{ fontWeight: 800, color: "#0F172A", fontSize: 12 }}>
                              {formatDate(rn.dueDate)}
                            </div>
                            {dueYear && (
                              <div style={{ fontSize: 10, color: "#0284C7", fontWeight: 700 }}>
                                Year: {dueYear}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: "#94A3B8", fontSize: 11 }}>No due date set</span>
                      )}
                    </td>

                    {/* Progress Status Buttons */}
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "inline-flex", gap: 4 }}>
                        {(["To-do", "In-progress", "Completed"] as ProgressStatus[]).map(p => {
                          const cfg = progressStatusConfig[p];
                          const isActive = rn.progress === p;
                          return (
                            <button
                              key={p}
                              onClick={() => handleStatusChange(rn, p)}
                              style={{
                                padding: "4px 9px", borderRadius: 14, cursor: "pointer", fontSize: 10.5, fontWeight: 800,
                                background: isActive ? cfg.bg : "#F8FAFC",
                                color: isActive ? cfg.color : "#94A3B8",
                                border: isActive ? `2px solid ${cfg.color}` : "1px solid #E2E8F0",
                                transition: "all 0.15s",
                              }}
                            >
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    {/* Actions: Renewal, View, Edit, Delete */}
                    <td className="col-actions" style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center", alignItems: "center" }}>
                        {/* Special 1-Click Renewal Button */}
                        <button
                          className="btn-slds btn-slds-primary"
                          style={{
                            background: "linear-gradient(135deg, #4F46E5 0%, #059669 100%)",
                            border: "none",
                            padding: "4px 10px",
                            fontSize: 11,
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            gap: 4
                          }}
                          onClick={() => handleRenewAction(rn)}
                          title="Click to automatically renew for the next cycle & update year"
                        >
                          <RefreshCw size={12} />
                          <span>Renewal</span>
                        </button>

                        <button
                          className="icon-btn-slds"
                          title="View Details & WhatsApp"
                          onClick={() => setViewModal({ open: true, item: rn })}
                        >
                          <Eye size={14} color="#0176D3" />
                        </button>

                        <button
                          className="icon-btn-slds"
                          title="Edit Renewal"
                          onClick={() => openEdit(rn)}
                        >
                          <Pencil size={14} color="#64748B" />
                        </button>

                        <button
                          className="icon-btn-slds"
                          title="Delete Renewal"
                          onClick={() => {
                            if (confirm(`Delete renewal record for "${rn.clientName}"?`)) {
                              deleteRenewal(rn.id);
                              toast.success("Renewal deleted.");
                            }
                          }}
                        >
                          <Trash2 size={14} color="#DC2626" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRenewals.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#64748B" }}>
                    No renewal records found. Click "+ Add Renewal Service" to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL: Add / Edit Renewal ────────────────────────────────── */}
      {modal.open && (
        <div className="modal-overlay" onClick={() => setModal({ open: false, editing: null })}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: "#4F46E5", color: "white" }}>
              <div className="modal-title">{modal.editing ? "Edit Renewal Service" : "Add New Renewal Service"}</div>
              <button className="btn-slds btn-slds-secondary" style={{ padding: "4px 8px", background: "rgba(255,255,255,0.2)", color: "white" }} onClick={() => setModal({ open: false, editing: null })}>✕</button>
            </div>
            <div className="modal-body" style={{ display: "grid", gap: 14, padding: 20 }}>
              
              {/* 1. Client Name (Manual Entry) */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>1. Client Name * (Manually Entered)</label>
                <input
                  className="command-palette-input"
                  style={{ width: "100%", padding: 8, fontSize: 13, borderRadius: 8, border: "1px solid #CBD5E1" }}
                  list="client-suggestions"
                  placeholder="Type client name e.g. Krishna, Gokul..."
                  value={form.clientName || ""}
                  onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                />
                <datalist id="client-suggestions">
                  {clients.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>

              {/* 2. Service Name (Manual Entry) */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>2. Service Name * (Manually Entered)</label>
                <input
                  className="command-palette-input"
                  style={{ width: "100%", padding: 8, fontSize: 13, borderRadius: 8, border: "1px solid #CBD5E1" }}
                  list="service-suggestions"
                  placeholder="Type service name e.g. GST License Renewal..."
                  value={form.serviceName || ""}
                  onChange={e => setForm(f => ({ ...f, serviceName: e.target.value }))}
                />
                <datalist id="service-suggestions">
                  {SUGGESTED_RENEWALS.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>

              {/* 3. Registration Date (Optional) */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>3. Registration Date (Optional)</label>
                <input
                  type="date"
                  className="command-palette-input"
                  style={{ width: "100%", padding: 8, fontSize: 13, borderRadius: 8, border: "1px solid #CBD5E1" }}
                  value={form.registrationDate || ""}
                  onChange={e => handleDateChange("registrationDate", e.target.value)}
                />
              </div>

              {/* 4. Recurrence Duration Dropdown */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>4. Recurrence / Duration Period</label>
                <select
                  className="command-palette-input"
                  style={{ width: "100%", padding: 8, fontSize: 13, borderRadius: 8, border: "1px solid #CBD5E1" }}
                  value={form.recurrencePeriod || "1 Year (Annual)"}
                  onChange={e => handleRecurrenceChange(e.target.value)}
                >
                  {RECURRENCE_PRESETS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* 5. Date & Financial Year (From to To) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>From Date</label>
                  <input
                    type="date"
                    className="command-palette-input"
                    style={{ width: "100%", padding: 8, fontSize: 13, borderRadius: 8, border: "1px solid #CBD5E1" }}
                    value={form.fromDate || ""}
                    onChange={e => handleDateChange("fromDate", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>To Date</label>
                  <input
                    type="date"
                    className="command-palette-input"
                    style={{ width: "100%", padding: 8, fontSize: 13, borderRadius: 8, border: "1px solid #CBD5E1" }}
                    value={form.toDate || ""}
                    onChange={e => handleDateChange("toDate", e.target.value)}
                  />
                </div>
              </div>

              {/* Editable Financial Year & Due Date */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Financial Year (Editable)</label>
                  <input
                    className="command-palette-input"
                    style={{ width: "100%", padding: 8, fontSize: 13, borderRadius: 8, border: "1px solid #CBD5E1", fontWeight: 700, color: "#1D4ED8" }}
                    placeholder="e.g. FY 2026-27 or 2026 - 2029"
                    value={form.financialYear || ""}
                    onChange={e => setForm(f => ({ ...f, financialYear: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Due Date &amp; Year</label>
                  <input
                    type="date"
                    className="command-palette-input"
                    style={{ width: "100%", padding: 8, fontSize: 13, borderRadius: 8, border: "1px solid #CBD5E1" }}
                    value={form.dueDate || ""}
                    onChange={e => handleDateChange("dueDate", e.target.value)}
                  />
                  {form.dueDate && (
                    <div style={{ fontSize: 11, color: "#0284C7", fontWeight: 700, marginTop: 2 }}>
                      Due Year: {new Date(form.dueDate).getFullYear()}
                    </div>
                  )}
                </div>
              </div>

              {/* 6. Progress Status */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>6. Progress Status</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["To-do", "In-progress", "Completed"] as ProgressStatus[]).map(p => {
                    const cfg = progressStatusConfig[p];
                    const isSelected = form.progress === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, progress: p }))}
                        style={{
                          flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer",
                          fontSize: 12.5, fontWeight: 800,
                          background: isSelected ? cfg.bg : "#F8FAFC",
                          color: isSelected ? cfg.color : "#64748B",
                          border: isSelected ? `2px solid ${cfg.color}` : "1px solid #CBD5E1",
                          transition: "all 0.15s",
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="modal-footer">
              <button className="btn-slds btn-slds-secondary" onClick={() => setModal({ open: false, editing: null })}>Cancel</button>
              <button className="btn-slds btn-slds-primary" style={{ background: "#4F46E5", border: "none" }} onClick={handleSave}>
                {modal.editing ? "Save Changes" : "Create Renewal Service"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: View Details ────────────────────────────────────────── */}
      {viewModal.open && viewModal.item && (
        <div className="modal-overlay" onClick={() => setViewModal({ open: false, item: null })}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: "#4F46E5", color: "white" }}>
              <div className="modal-title">Renewal Service Details</div>
              <button className="btn-slds btn-slds-secondary" style={{ padding: "4px 8px", background: "rgba(255,255,255,0.2)", color: "white" }} onClick={() => setViewModal({ open: false, item: null })}>✕</button>
            </div>
            <div className="modal-body" style={{ display: "grid", gap: 16, padding: 24 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Client Name</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#0F172A", marginTop: 2 }}>{viewModal.item.clientName}</div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Service Name</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#4F46E5", marginTop: 2 }}>{viewModal.item.serviceName}</div>
                {viewModal.item.recurrencePeriod && (
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Duration: {viewModal.item.recurrencePeriod}</div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Registration Date</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginTop: 2 }}>
                    {viewModal.item.registrationDate ? formatDate(viewModal.item.registrationDate) : "Not specified"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Financial Year</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#1D4ED8", marginTop: 2 }}>
                    {viewModal.item.financialYear || "FY 2026-27"}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Validity (From - To)</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                    {viewModal.item.fromDate ? formatDate(viewModal.item.fromDate) : "-"} to {viewModal.item.toDate ? formatDate(viewModal.item.toDate) : "-"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Due Date &amp; Year</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>
                    {viewModal.item.dueDate ? `${formatDate(viewModal.item.dueDate)} (${new Date(viewModal.item.dueDate).getFullYear()})` : "No due date set"}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Progress Status</div>
                <div style={{ marginTop: 4 }}>
                  {(() => {
                    const cfg = progressStatusConfig[viewModal.item.progress || "To-do"];
                    return (
                      <span style={{ padding: "4px 12px", background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                        {cfg.label}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: "space-between" }}>
              {(() => {
                const item = viewModal.item!;
                const client = clients.find(c => c.name.toLowerCase() === item.clientName.toLowerCase());
                const phone = client?.phone || client?.mobile || "";
                const msgText = `Hi ${item.clientName}, this is a renewal reminder for *${item.serviceName}* (${item.financialYear || "FY Renewal"}). Due Date: ${item.dueDate ? formatDate(item.dueDate) : "Upcoming"}. Please renew at the earliest. Thank you!`;
                const waLink = phone ? getWhatsAppLink(phone, msgText) : `https://wa.me/?text=${encodeURIComponent(msgText)}`;

                return (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-slds btn-slds-success"
                    style={{ padding: "7px 16px", fontSize: 12 }}
                    title={phone ? `Send WhatsApp to ${phone}` : "Open WhatsApp"}
                  >
                    <MessageCircle size={14} />
                    <span>Send WhatsApp Reminder</span>
                  </a>
                );
              })()}
              <button className="btn-slds btn-slds-secondary" onClick={() => setViewModal({ open: false, item: null })}>Close</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
