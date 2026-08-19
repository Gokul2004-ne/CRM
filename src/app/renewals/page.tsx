"use client";

import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { RenewalItem, ProgressStatus } from "@/lib/types";
import {
  Plus, Pencil, Trash2, Search, Eye, Calendar, RefreshCw, MessageCircle,
  Clock, CheckCircle2, Sparkles
} from "lucide-react";
import { formatDate, getWhatsAppLink } from "@/lib/utils";
import { toast } from "sonner";

const progressStatusConfig: Record<ProgressStatus, { label: string; color: string; bg: string; border: string }> = {
  "To-do": { label: "To-do", color: "#475569", bg: "#F1F5F9", border: "#CBD5E1" },
  "In-progress": { label: "In-progress", color: "#D97706", bg: "#FFFBEB", border: "#FCD34D" },
  "Completed": { label: "Completed", color: "#059669", bg: "#F0FDF4", border: "#6EE7B7" },
};

const RECURRENCE_PRESETS = [
  "1 Year",
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

// Helper to calculate Financial Year string from dates
const computeFY = (fromStr?: string, toStr?: string): string => {
  if (!fromStr && !toStr) return "";
  const d1 = fromStr ? new Date(fromStr) : null;
  const d2 = toStr ? new Date(toStr) : null;

  const y1 = d1 && !isNaN(d1.getFullYear()) ? d1.getFullYear() : null;
  const y2 = d2 && !isNaN(d2.getFullYear()) ? d2.getFullYear() : null;

  if (y1 && y2) {
    return y1 === y2 ? `${y1}` : `${y1} - ${y2}`;
  }
  if (y1) return `${y1}`;
  if (y2) return `${y2}`;
  return "";
};

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
    financialYear: `${currentYear} - ${currentYear + 1}`,
    recurrencePeriod: "1 Year",
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

  // Auto-calculate Financial Year when From/To dates change
  const handleDateChange = (field: "fromDate" | "toDate" | "registrationDate", value: string) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };

      if (field === "toDate" && value) {
        updated.dueDate = value; // Keep internal dueDate in sync with toDate
      }

      if (field === "fromDate" || field === "toDate") {
        const calculatedFY = computeFY(updated.fromDate, updated.toDate);
        if (calculatedFY) {
          updated.financialYear = calculatedFY;
        }
      }

      return updated;
    });
  };

  // Handle Recurrence change to auto-set To Date & Financial Year
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

      const fromDateStr = prev.fromDate || fromD.toISOString().split("T")[0];
      const calculatedFY = computeFY(fromDateStr, toDateStr);

      return {
        ...prev,
        recurrencePeriod: period,
        toDate: toDateStr,
        dueDate: toDateStr,
        financialYear: calculatedFY || prev.financialYear
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
      const dateA = a.toDate || a.dueDate || "";
      const dateB = b.toDate || b.dueDate || "";
      if (dateA && !dateB) return -1;
      if (!dateA && dateB) return 1;
      if (dateA && dateB) return dateA.localeCompare(dateB);
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
        dueDate: form.toDate || form.dueDate || "",
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
    renewService(rn.id);
    toast.success(`Service "${rn.serviceName}" renewed for next cycle!`);
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
    <AppShell title="Renewals Management" subtitle="Track client service renewals, validity periods, and financial years">
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
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#64748B" }}>To-do</span>
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
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F8FAFC", color: "#475569", textTransform: "uppercase", fontSize: 11, fontWeight: 800, borderBottom: "2px solid #E2E8F0", letterSpacing: "0.5px" }}>
                <th className="col-num" style={{ padding: "14px 12px", width: 50, textAlign: "center" }}>#</th>
                <th style={{ padding: "14px 16px", textAlign: "left", minWidth: 170 }}>Client Name</th>
                <th style={{ padding: "14px 16px", textAlign: "left", minWidth: 180 }}>Service Name</th>
                <th style={{ padding: "14px 16px", textAlign: "center", minWidth: 150 }}>Registration Date</th>
                <th style={{ padding: "14px 16px", textAlign: "left", minWidth: 220 }}>Validity &amp; Financial Year</th>
                <th style={{ padding: "14px 16px", textAlign: "center", minWidth: 260 }}>Progress Status</th>
                <th className="col-actions" style={{ padding: "14px 16px", textAlign: "center", minWidth: 180 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRenewals.map((rn, idx) => {
                const clientObj = clients.find(c => c.name.toLowerCase() === rn.clientName.toLowerCase());
                const phone = clientObj?.phone || clientObj?.mobile || "";

                return (
                  <tr key={rn.id} style={{ borderBottom: "1px solid #F1F5F9", background: idx % 2 === 0 ? "#FFFFFF" : "#FAFBFD" }}>
                    <td className="col-num" style={{ padding: "14px 12px", textAlign: "center", fontWeight: 700, color: "#94A3B8" }}>{idx + 1}</td>

                    {/* Client Name */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 800, color: "#0F172A", fontSize: 13.5 }}>{rn.clientName}</div>
                      {phone && <div style={{ fontSize: 11, color: "#0284C7", marginTop: 2, fontWeight: 600 }}>{phone}</div>}
                    </td>

                    {/* Service Name */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 800, color: "#4F46E5", fontSize: 13.5 }}>{rn.serviceName}</div>
                      {rn.recurrencePeriod && (
                        <span style={{ display: "inline-block", fontSize: 10.5, fontWeight: 700, color: "#64748B", background: "#F1F5F9", padding: "2px 8px", borderRadius: 10, marginTop: 4 }}>
                          {rn.recurrencePeriod}
                        </span>
                      )}
                    </td>

                    {/* Registration Date (Optional) */}
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      {rn.registrationDate ? (
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#334155", background: "#F8FAFC", padding: "4px 10px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                          {formatDate(rn.registrationDate)}
                        </span>
                      ) : (
                        <span style={{ color: "#94A3B8", fontSize: 12 }}>-</span>
                      )}
                    </td>

                    {/* Validity & Financial Year (From - To) */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ background: "#EFF6FF", color: "#1D4ED8", fontWeight: 800, fontSize: 11.5, padding: "3px 10px", borderRadius: 8, border: "1px solid #BFDBFE", width: "fit-content" }}>
                          {rn.financialYear || "FY Renewal"}
                        </span>
                        {(rn.fromDate || rn.toDate) && (
                          <div style={{ fontSize: 11.5, color: "#475569", fontWeight: 600, whiteSpace: "nowrap" }}>
                            {rn.fromDate ? formatDate(rn.fromDate) : "?"} to {rn.toDate ? formatDate(rn.toDate) : "?"}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Progress Status Buttons */}
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <div style={{ display: "inline-flex", gap: 5, background: "#F8FAFC", padding: 4, borderRadius: 18, border: "1px solid #E2E8F0" }}>
                        {(["To-do", "In-progress", "Completed"] as ProgressStatus[]).map(p => {
                          const cfg = progressStatusConfig[p];
                          const isActive = rn.progress === p;
                          return (
                            <button
                              key={p}
                              onClick={() => handleStatusChange(rn, p)}
                              style={{
                                padding: "5px 12px", borderRadius: 14, cursor: "pointer", fontSize: 11, fontWeight: 800,
                                background: isActive ? cfg.bg : "transparent",
                                color: isActive ? cfg.color : "#64748B",
                                border: isActive ? `1.5px solid ${cfg.color}` : "none",
                                whiteSpace: "nowrap",
                                boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
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
                    <td className="col-actions" style={{ padding: "14px 16px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center", alignItems: "center" }}>
                        {/* Special 1-Click Renewal Button */}
                        <button
                          className="btn-slds"
                          style={{
                            background: "linear-gradient(135deg, #4F46E5 0%, #059669 100%)",
                            color: "white",
                            border: "none",
                            padding: "6px 12px",
                            fontSize: 11.5,
                            fontWeight: 800,
                            borderRadius: 8,
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            whiteSpace: "nowrap",
                            boxShadow: "0 2px 6px rgba(79,70,229,0.3)"
                          }}
                          onClick={() => handleRenewAction(rn)}
                          title="Click to automatically renew for the next cycle & update year"
                        >
                          <RefreshCw size={13} />
                          <span>Renewal</span>
                        </button>

                        <button
                          className="icon-btn-slds"
                          style={{ padding: 6, borderRadius: 8, background: "#F1F5F9" }}
                          title="View Details &amp; WhatsApp"
                          onClick={() => setViewModal({ open: true, item: rn })}
                        >
                          <Eye size={15} color="#0176D3" />
                        </button>

                        <button
                          className="icon-btn-slds"
                          style={{ padding: 6, borderRadius: 8, background: "#F1F5F9" }}
                          title="Edit Renewal"
                          onClick={() => openEdit(rn)}
                        >
                          <Pencil size={15} color="#64748B" />
                        </button>

                        <button
                          className="icon-btn-slds"
                          style={{ padding: 6, borderRadius: 8, background: "#FEE2E2" }}
                          title="Delete Renewal"
                          onClick={async () => {
                            try {
                              await deleteRenewal(rn.id);
                              toast.success(`Deleted renewal record for "${rn.clientName}"`);
                            } catch (err) {
                              console.error(err);
                              toast.error("Failed to delete entry from database. Please try again.");
                            }
                          }}
                        >
                          <Trash2 size={15} color="#DC2626" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRenewals.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#64748B" }}>
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
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: "#4F46E5", color: "white" }}>
              <div className="modal-title">{modal.editing ? "Edit Renewal Service" : "Add New Renewal Service"}</div>
              <button className="btn-slds btn-slds-secondary" style={{ padding: "4px 8px", background: "rgba(255,255,255,0.2)", color: "white" }} onClick={() => setModal({ open: false, editing: null })}>✕</button>
            </div>
            
            <div className="modal-body" style={{ display: "grid", gap: 16, padding: 20 }}>

              {/* SECTION 1: Client & Service Information */}
              <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 10, border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", marginBottom: 10, letterSpacing: "0.5px" }}>
                  Client &amp; Service Information
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: 12.5 }}>Client Name *</label>
                    <input
                      className="command-palette-input"
                      style={{ width: "100%", padding: "8px 12px", fontSize: 13, borderRadius: 8, border: "1px solid #CBD5E1" }}
                      list="client-suggestions"
                      placeholder="e.g. Krishna, Gokul..."
                      value={form.clientName || ""}
                      onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                    />
                    <datalist id="client-suggestions">
                      {clients.map(c => <option key={c.id} value={c.name} />)}
                    </datalist>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: 12.5 }}>Service Name *</label>
                    <input
                      className="command-palette-input"
                      style={{ width: "100%", padding: "8px 12px", fontSize: 13, borderRadius: 8, border: "1px solid #CBD5E1" }}
                      list="service-suggestions"
                      placeholder="e.g. GST Registration Renewal..."
                      value={form.serviceName || ""}
                      onChange={e => setForm(f => ({ ...f, serviceName: e.target.value }))}
                    />
                    <datalist id="service-suggestions">
                      {SUGGESTED_RENEWALS.map(s => <option key={s} value={s} />)}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Validity & Financial Year */}
              <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 10, border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", marginBottom: 10, letterSpacing: "0.5px" }}>
                  Validity &amp; Financial Year
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: 12.5 }}>Registration Date <span style={{ fontWeight: 400, color: "#64748B" }}>(Optional)</span></label>
                    <input
                      type="date"
                      className="command-palette-input"
                      style={{ width: "100%", padding: "8px 12px", fontSize: 13, borderRadius: 8, border: "1px solid #CBD5E1" }}
                      value={form.registrationDate || ""}
                      onChange={e => handleDateChange("registrationDate", e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: 12.5 }}>Recurrence / Duration</label>
                    <select
                      className="command-palette-input"
                      style={{ width: "100%", padding: "8px 12px", fontSize: 13, borderRadius: 8, border: "1px solid #CBD5E1" }}
                      value={form.recurrencePeriod || "1 Year"}
                      onChange={e => handleRecurrenceChange(e.target.value)}
                    >
                      {RECURRENCE_PRESETS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: 12.5 }}>From Date</label>
                    <input
                      type="date"
                      className="command-palette-input"
                      style={{ width: "100%", padding: "8px 12px", fontSize: 13, borderRadius: 8, border: "1px solid #CBD5E1" }}
                      value={form.fromDate || ""}
                      onChange={e => handleDateChange("fromDate", e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: 12.5 }}>To Date (Expiry Date)</label>
                    <input
                      type="date"
                      className="command-palette-input"
                      style={{ width: "100%", padding: "8px 12px", fontSize: 13, borderRadius: 8, border: "1px solid #CBD5E1" }}
                      value={form.toDate || ""}
                      onChange={e => handleDateChange("toDate", e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 12.5 }}>Financial Year</label>
                  <input
                    className="command-palette-input"
                    style={{ width: "100%", padding: "8px 12px", fontSize: 13, borderRadius: 8, border: "1px solid #CBD5E1", fontWeight: 700, color: "#1D4ED8", background: "#FFFFFF" }}
                    placeholder="e.g. 2026 - 2027"
                    value={form.financialYear || ""}
                    onChange={e => setForm(f => ({ ...f, financialYear: e.target.value }))}
                  />
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 4, fontWeight: 500 }}>
                    ⚡ Auto-calculated when dates change. You can also edit it manually.
                  </div>
                </div>
              </div>

              {/* SECTION 3: Progress Status */}
              <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 10, border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: "#475569", textTransform: "uppercase", marginBottom: 10, letterSpacing: "0.5px" }}>
                  Progress Status
                </div>
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
                          background: isSelected ? cfg.bg : "#FFFFFF",
                          color: isSelected ? cfg.color : "#64748B",
                          border: isSelected ? `2px solid ${cfg.color}` : "1px solid #CBD5E1",
                          boxShadow: isSelected ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
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
                    {viewModal.item.financialYear || "FY Renewal"}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Validity Period</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                  {viewModal.item.fromDate ? formatDate(viewModal.item.fromDate) : "-"} to {viewModal.item.toDate ? formatDate(viewModal.item.toDate) : "-"}
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
                const expiryStr = item.toDate ? formatDate(item.toDate) : "Upcoming";
                const msgText = `Hi ${item.clientName}, this is a renewal reminder for *${item.serviceName}* (${item.financialYear || "FY Renewal"}). Expiry Date: ${expiryStr}. Please renew at the earliest. Thank you!`;
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
