"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo, useRef } from "react";
import { formatCurrency, formatDate, getCurrentFY, getFYOptions, numberToWords, ensureUUID } from "@/lib/utils";
import { Invoice, InvoiceItem, InvoiceType } from "@/lib/types";
import {
  Plus, Printer, Eye, X, IndianRupee, FileText, Filter, CheckCircle2,
  AlertCircle, RefreshCw, Trash2, Pencil, Search, ArrowUpRight, TrendingUp, Clock, Crown
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const PRESET_DESCRIPTIONS = [
  "GST Filing & Compliance Services",
  "Income Tax Return & Audit Services",
  "TDS Quarterly Return Processing",
  "ROC Annual Compliance & Secretarial",
  "Accounting & Bookkeeping Services",
  "Tax Advisory & Legal Consultancy",
  "Business Incorporation & Registration",
  "Custom Service / Professional Charges"
];

const defaultItem = (): InvoiceItem => ({
  id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
  description: PRESET_DESCRIPTIONS[0],
  hsn: "998311",
  quantity: 1,
  rate: 5000,
  amount: 5000,
});

export default function InvoicePage() {
  const { user } = useAuth();
  const { clients, invoices, selectedFY, addInvoice, updateInvoice, deleteInvoice } = useAppStore();

  const [entityFilter, setEntityFilter] = useState<"ALL" | "PROFORMA" | "INVOICE">("ALL");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ open: boolean; type: InvoiceType; isEditing?: boolean } | null>(null);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  const [form, setForm] = useState<Partial<Invoice>>({
    type: "PROFORMA",
    date: new Date().toISOString().split("T")[0],
    financialYear: getCurrentFY(),
    clientId: "",
    items: [defaultItem()],
    gstRate: 18,
    amountReceived: 0,
    notes: "Payment due within 15 days of invoice date. Thank you for your business!",
    status: "DRAFT",
  });

  const printRef = useRef<HTMLDivElement>(null);
  const isSavingRef = useRef(false);

  const invoiceCount = useMemo(() => invoices.filter(i => i.type === "INVOICE").length, [invoices]);
  const proformaCount = useMemo(() => invoices.filter(i => i.type === "PROFORMA").length, [invoices]);

  // Summary Metrics
  const totalInvoiced = useMemo(() => invoices.filter(i => i.type === "INVOICE").reduce((s, i) => s + (i.total || 0), 0), [invoices]);
  const totalCollected = useMemo(() => invoices.filter(i => i.type === "INVOICE").reduce((s, i) => s + (i.amountReceived || 0), 0), [invoices]);
  const totalPending = useMemo(() => Math.max(0, totalInvoiced - totalCollected), [totalInvoiced, totalCollected]);
  const proformaValue = useMemo(() => invoices.filter(i => i.type === "PROFORMA").reduce((s, i) => s + (i.total || 0), 0), [invoices]);

  const getInvoiceNumber = (type: InvoiceType) => {
    const prefix = type === "INVOICE" ? "INV" : "PRO";
    const count = type === "INVOICE" ? invoiceCount + 1 : proformaCount + 1;
    const year = new Date().getFullYear();
    return `${prefix}/${year}-${String(count).padStart(4, "0")}`;
  };

  const openCreate = (type: InvoiceType) => {
    setForm({
      type,
      invoiceNumber: getInvoiceNumber(type),
      date: new Date().toISOString().split("T")[0],
      financialYear: selectedFY || getCurrentFY(),
      clientId: "",
      items: [defaultItem()],
      gstRate: 18,
      amountReceived: 0,
      notes: "Payment due within 15 days of invoice date. Thank you for your business!",
      status: "DRAFT",
    });
    setModal({ open: true, type, isEditing: false });
  };

  const openEdit = (inv: Invoice) => {
    setForm({
      ...inv,
      items: inv.items && inv.items.length > 0 ? [...inv.items] : [defaultItem()]
    });
    setModal({ open: true, type: inv.type, isEditing: true });
  };

  const updateItem = (idx: number, field: keyof InvoiceItem, value: any) => {
    setForm(f => {
      const items = [...(f.items || [])];
      items[idx] = { ...items[idx], [field]: value };
      if (field === "quantity" || field === "rate") {
        items[idx].amount = Number(items[idx].quantity || 0) * Number(items[idx].rate || 0);
      }
      return { ...f, items };
    });
  };

  const addItem = () => {
    setForm(f => ({ ...f, items: [...(f.items || []), defaultItem()] }));
  };

  const removeItem = (idx: number) => {
    setForm(f => ({ ...f, items: (f.items || []).filter((_, i) => i !== idx) }));
  };

  const subtotal = useMemo(() => (form.items || []).reduce((s, i) => s + (i.amount || 0), 0), [form.items]);
  const gstAmount = useMemo(() => {
    const rate = form.gstRate ?? 18;
    if (rate === 0) return 0;
    return (subtotal * rate) / 100;
  }, [subtotal, form.gstRate]);
  const total = useMemo(() => subtotal + gstAmount, [subtotal, gstAmount]);
  const balanceDue = useMemo(() => Math.max(0, total - (form.amountReceived || 0)), [total, form.amountReceived]);

  const handleSave = (status: "DRAFT" | "SENT" | "PAID") => {
    if (isSavingRef.current) return; // Prevent double submission
    if (!form.clientId) {
      toast.error("Please select a client");
      return;
    }
    isSavingRef.current = true;
    const clientObj = clients.find(c => c.id === form.clientId || (form.clientId && ensureUUID(c.id) === ensureUUID(form.clientId)));
    const finalAmountReceived = status === "PAID" ? total : (form.amountReceived || 0);

    const invoiceRecord: Invoice = {
      ...(form as Invoice),
      id: form.id || `inv_${Date.now()}`,
      clientName: clientObj?.name || "Client",
      subtotal,
      gstAmount,
      total,
      amountReceived: finalAmountReceived,
      balanceDue: Math.max(0, total - finalAmountReceived),
      status,
      createdAt: form.createdAt || new Date().toISOString(),
    };

    // Close modal immediately to prevent re-entry
    setModal(null);

    if (modal?.isEditing || form.id) {
      updateInvoice(invoiceRecord);
      toast.success(`🎉 ${invoiceRecord.type} #${invoiceRecord.invoiceNumber} updated & saved successfully!`);
    } else {
      // Guard: Check if invoice number already exists in state
      const duplicate = invoices.find(i => i.invoiceNumber === invoiceRecord.invoiceNumber && i.type === invoiceRecord.type);
      if (!duplicate) {
        addInvoice(invoiceRecord);
        if (invoiceRecord.type === "PROFORMA") {
          toast.success(`🎉 Pro Forma #${invoiceRecord.invoiceNumber} created successfully!`);
        } else {
          toast.success(`🎉 Tax Invoice #${invoiceRecord.invoiceNumber} created! Redirecting to Banking Ledger...`);
          setTimeout(() => {
            window.location.href = "/banking";
          }, 800);
        }
      } else {
        toast.info(`Invoice #${invoiceRecord.invoiceNumber} already exists.`);
      }
    }

    setTimeout(() => { isSavingRef.current = false; }, 1000);
  };


  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesType =
        entityFilter === "ALL" ? true :
        entityFilter === "PROFORMA" ? inv.type === "PROFORMA" : inv.type === "INVOICE";
      const matchesSearch =
        (inv.invoiceNumber || "").toLowerCase().includes(search.toLowerCase()) ||
        (inv.clientName || "").toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [invoices, entityFilter, search]);

  const handlePrint = () => {
    window.print();
  };

  const fyOptions = getFYOptions();

  const statusConfig = {
    DRAFT: { bg: "#F1F5F9", color: "#64748B", label: "Draft" },
    SENT: { bg: "#FFFBEB", color: "#D97706", label: "Sent" },
    PAID: { bg: "#F0FDF4", color: "#059669", label: "Paid" },
  };

  return (
    <AppShell title="Invoices & Billing Workspace" subtitle="Create, edit, track, and print professional tax invoices and proformas">
      {/* Header Banner */}
      <div className="page-header-slds">
        <div>
          <div className="breadcrumb">
            <span>zpluscrm</span>
            <span>/</span>
            <span className="current">Invoices & Billing</span>
          </div>
          <div className="page-title-slds">Invoices & Proformas Workspace</div>
          <div className="page-subtitle-slds">
            Generate GST-compliant Tax Invoices, manage Pro Forma quotes, and auto-sync payments with Banking.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-slds btn-slds-secondary" onClick={() => openCreate("PROFORMA")}>
            <Plus size={15} /> New Proforma
          </button>
          <button className="btn-slds btn-slds-primary" onClick={() => openCreate("INVOICE")}>
            <Plus size={15} /> New Tax Invoice
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16, marginBottom: 20 }}>
        <div className="card-slds" style={{ padding: 18, background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", color: "white", borderRadius: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#94A3B8" }}>Total Tax Invoiced</span>
            <div style={{ padding: 8, background: "rgba(59, 130, 246, 0.15)", borderRadius: 10, color: "#60A5FA" }}><IndianRupee size={18} /></div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, marginTop: 10 }}>{formatCurrency(totalInvoiced)}</div>
          <div style={{ fontSize: 12, color: "#60A5FA", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <TrendingUp size={13} /> <span>{invoiceCount} Total Tax Invoices Issued</span>
          </div>
        </div>

        <div className="card-slds" style={{ padding: 18, background: "linear-gradient(135deg, #065F46 0%, #047857 100%)", color: "white", borderRadius: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#A7F3D0" }}>Amount Collected</span>
            <div style={{ padding: 8, background: "rgba(16, 185, 129, 0.2)", borderRadius: 10, color: "#34D399" }}><CheckCircle2 size={18} /></div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, marginTop: 10 }}>{formatCurrency(totalCollected)}</div>
          <div style={{ fontSize: 12, color: "#A7F3D0", marginTop: 4 }}>Linked with Banking Ledger</div>
        </div>

        <div className="card-slds" style={{ padding: 18, background: "linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%)", color: "white", borderRadius: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#FCA5A5" }}>Pending Balance</span>
            <div style={{ padding: 8, background: "rgba(239, 68, 68, 0.2)", borderRadius: 10, color: "#F87171" }}><Clock size={18} /></div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, marginTop: 10 }}>{formatCurrency(totalPending)}</div>
          <div style={{ fontSize: 12, color: "#FCA5A5", marginTop: 4 }}>Outstanding Client Receivables</div>
        </div>

        <div className="card-slds" style={{ padding: 18, background: "linear-gradient(135deg, #431407 0%, #7C2D12 100%)", color: "white", borderRadius: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#FFEDD5" }}>Proforma Quotes</span>
            <div style={{ padding: 8, background: "rgba(249, 115, 22, 0.2)", borderRadius: 10, color: "#FB923C" }}><FileText size={18} /></div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, marginTop: 10 }}>{formatCurrency(proformaValue)}</div>
          <div style={{ fontSize: 12, color: "#FFEDD5", marginTop: 4 }}>{proformaCount} Pro Forma Quotes Issued</div>
        </div>
      </div>

      {/* Main Table Toolbar */}
      <div className="data-table-wrapper">
        <div className="data-table-header" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12 }}>
          {/* Entity Filter Buttons */}
          <div className="toolbar-controls" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", display: "flex", alignItems: "center", gap: 4 }}>
              <Filter size={14} /> Filter:
            </div>
            <div style={{ display: "flex", gap: 4, background: "#F1F5F9", padding: 3, borderRadius: 8 }}>
              {(["ALL", "PROFORMA", "INVOICE"] as const).map(type => (
                <button
                  key={type}
                  className="btn-slds"
                  style={{
                    padding: "4px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    borderRadius: 6,
                    border: "none",
                    background: entityFilter === type ? "#0F172A" : "transparent",
                    color: entityFilter === type ? "#FFFFFF" : "#64748B",
                  }}
                  onClick={() => setEntityFilter(type)}
                >
                  {type === "ALL" ? `All (${invoices.length})` : type === "PROFORMA" ? `Proforma (${proformaCount})` : `Tax Invoice (${invoiceCount})`}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="search-input-wrapper" style={{ maxWidth: 300 }}>
            <Search size={15} />
            <input
              type="text"
              placeholder="Search by doc # or client name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table of Invoices & Proformas */}
        <div className="table-scroll-container">
          <table className="table-slds">
            <thead>
              <tr>
                <th style={{ width: 50, textAlign: "center" }}>#</th>
                <th>Type</th>
                <th>Doc #</th>
                <th>FY</th>
                <th>Client Name</th>
                <th>Date</th>
                <th>Total Billed</th>
                <th>Received</th>
                <th>Balance Due</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv, i) => {
                  const clientObj = clients.find(c => c.id === inv.clientId);
                  const clientName = inv.clientName || clientObj?.name || "-";
                  const cfg = statusConfig[inv.status || "DRAFT"];
                  const rcv = inv.amountReceived || 0;
                  const bal = inv.balanceDue !== undefined ? inv.balanceDue : Math.max(0, inv.total - rcv);

                  return (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 700, color: "#64748B", textAlign: "center" }}>{i + 1}</td>
                      <td>
                        <span
                          className="badge-slds"
                          style={{
                            background: inv.type === "INVOICE" ? "#EFF6FF" : "#FFF7ED",
                            color: inv.type === "INVOICE" ? "#1D4ED8" : "#C2410C",
                            border: `1px solid ${inv.type === "INVOICE" ? "#BFDBFE" : "#FFEDD5"}`,
                            fontWeight: 800,
                            padding: "3px 8px",
                          }}
                        >
                          {inv.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800, color: "#0F172A", fontFamily: "monospace" }}>{inv.invoiceNumber}</td>
                      <td><span className="chip" style={{ background: "#F1F5F9", color: "#334155", fontWeight: 600 }}>FY {inv.financialYear || getCurrentFY()}</span></td>
                      <td style={{ fontWeight: 800, color: "#0F172A" }}>{clientName}</td>
                      <td style={{ fontSize: 13, color: "#475569" }}>{inv.date}</td>
                      <td style={{ fontWeight: 800, color: "#0F172A" }}>{formatCurrency(inv.total)}</td>
                      <td style={{ fontWeight: 800, color: "#059669" }}>{formatCurrency(rcv)}</td>
                      <td style={{ fontWeight: 800, color: bal > 0 ? "#DC2626" : "#059669" }}>{formatCurrency(bal)}</td>
                      <td>
                        <span className="badge-slds" style={{ background: cfg.bg, color: cfg.color, fontWeight: 700, padding: "3px 8px" }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center", alignItems: "center" }}>
                          {/* EDIT INVOICE BUTTON */}
                          <button
                            className="btn-slds"
                            style={{ padding: "4px 8px", fontSize: 11, fontWeight: 700, background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}
                            onClick={() => openEdit(inv)}
                            title="Edit Invoice Details"
                          >
                            <Pencil size={12} style={{ marginRight: 3 }} />
                            Edit
                          </button>

                          {inv.type === "PROFORMA" && (
                            <button
                              className="btn-slds btn-slds-primary"
                              style={{ padding: "4px 8px", fontSize: 11, fontWeight: 700, background: "#2563EB" }}
                              onClick={() => {
                                const nextInvNum = getInvoiceNumber("INVOICE");
                                const converted: Invoice = {
                                  ...inv,
                                  type: "INVOICE",
                                  invoiceNumber: nextInvNum,
                                  status: "SENT"
                                };
                                updateInvoice(converted);
                                toast.success(`Proforma ${inv.invoiceNumber} converted to Tax Invoice ${nextInvNum}!`);
                              }}
                              title="Convert Proforma to Tax Invoice"
                            >
                              <RefreshCw size={11} style={{ marginRight: 3 }} />
                              Convert
                            </button>
                          )}
                          <button
                            className="btn-slds btn-slds-secondary"
                            style={{ padding: "4px 8px" }}
                            onClick={() => setViewInvoice(inv)}
                            title="View / Print Document"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            className="btn-slds"
                            style={{ padding: "4px 8px", fontSize: 11, fontWeight: 700, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}
                            onClick={async () => {
                              try {
                                await deleteInvoice(inv.id);
                                toast.success(`${inv.type} #${inv.invoiceNumber} deleted!`);
                              } catch (err) {
                                console.error(err);
                                toast.error("Failed to delete entry from database. Please try again.");
                              }
                            }}
                            title="Delete document"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: 36, color: "#64748B" }}>
                    No {entityFilter === "ALL" ? "invoices or proformas" : entityFilter.toLowerCase() + "s"} found. Click button above to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Invoice & Proforma Modal */}
      {modal && (
        <div className="command-palette-backdrop" onClick={() => setModal(null)}>
          <div className="command-palette-card" style={{ maxWidth: 780, width: "95%" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0F172A" }}>
                {modal.isEditing ? `Edit ${modal.type} #${form.invoiceNumber}` : modal.type === "INVOICE" ? "Create Tax Invoice" : "Create Proforma Invoice"}
              </div>
              <button className="btn-slds btn-slds-secondary" style={{ padding: "4px 8px" }} onClick={() => setModal(null)}>✕</button>
            </div>

            <div style={{ padding: 24, display: "grid", gap: 16, maxHeight: "78vh", overflowY: "auto" }}>
              {/* Row 1: Document #, Date, Financial Year */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Document Number</label>
                  <input className="command-palette-input" value={form.invoiceNumber || ""} readOnly style={{ background: "#F1F5F9", borderRadius: 8, padding: 8, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Document Date *</label>
                  <input className="command-palette-input" type="date" style={{ borderRadius: 8, padding: 8, fontSize: 13, border: "1px solid #CBD5E1" }} value={form.date || ""} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Financial Year *</label>
                  <select className="command-palette-input" style={{ borderRadius: 8, padding: 8, fontSize: 13, border: "1px solid #CBD5E1" }} value={form.financialYear || selectedFY} onChange={e => setForm(f => ({ ...f, financialYear: e.target.value }))}>
                    {fyOptions.map(fy => <option key={fy} value={fy}>FY {fy}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2: Client Name */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Client Name *</label>
                <select className="command-palette-input" style={{ borderRadius: 8, padding: 8, fontSize: 13, border: "1px solid #CBD5E1" }} value={form.clientId || ""} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}>
                  <option value="">Select a client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.pan ? `(PAN: ${c.pan})` : ""}</option>
                  ))}
                </select>
              </div>

              {/* Items Table */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Service Items / Particulars</label>
                  <button type="button" className="btn-slds btn-slds-secondary" style={{ padding: "3px 8px", fontSize: 11 }} onClick={addItem}>
                    <Plus size={12} /> Add Item Row
                  </button>
                </div>

                <div style={{ border: "1px solid #CBD5E1", borderRadius: 8, overflow: "hidden" }}>
                  <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#F8FAFC", color: "#475569", textTransform: "uppercase", fontSize: 10, fontWeight: 700 }}>
                        <th style={{ padding: "8px 10px", textAlign: "left" }}>Description / Service Options</th>
                        <th style={{ padding: "8px 10px", width: 90, textAlign: "left" }}>HSN/SAC</th>
                        <th style={{ padding: "8px 10px", width: 60, textAlign: "center" }}>Qty</th>
                        <th style={{ padding: "8px 10px", width: 100, textAlign: "right" }}>Rate (₹)</th>
                        <th style={{ padding: "8px 10px", width: 110, textAlign: "right" }}>Amount (₹)</th>
                        <th style={{ padding: "8px 10px", width: 40 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(form.items || []).map((item, idx) => (
                        <tr key={item.id || idx} style={{ borderTop: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "6px 10px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              <select
                                className="command-palette-input"
                                style={{ fontSize: 12, padding: "4px 8px", borderRadius: 6, border: "1px solid #CBD5E1" }}
                                value={PRESET_DESCRIPTIONS.includes(item.description) ? item.description : "CUSTOM"}
                                onChange={e => {
                                  if (e.target.value !== "CUSTOM") {
                                    updateItem(idx, "description", e.target.value);
                                  }
                                }}
                              >
                                {PRESET_DESCRIPTIONS.map(desc => (
                                  <option key={desc} value={desc}>{desc}</option>
                                ))}
                                <option value="CUSTOM">Type custom description below...</option>
                              </select>
                              <input
                                className="command-palette-input"
                                style={{ fontSize: 12, padding: "4px 8px", borderRadius: 6, border: "1px solid #CBD5E1" }}
                                value={item.description}
                                onChange={e => updateItem(idx, "description", e.target.value)}
                                placeholder="Service description..."
                              />
                            </div>
                          </td>
                          <td style={{ padding: "6px 10px" }}>
                            <input className="command-palette-input" style={{ fontSize: 12, padding: "4px 8px", borderRadius: 6, border: "1px solid #CBD5E1" }} value={item.hsn} onChange={e => updateItem(idx, "hsn", e.target.value)} placeholder="998311" />
                          </td>
                          <td style={{ padding: "6px 10px" }}>
                            <input className="command-palette-input" type="number" style={{ fontSize: 12, padding: "4px 8px", textAlign: "center", borderRadius: 6, border: "1px solid #CBD5E1" }} value={item.quantity} onChange={e => updateItem(idx, "quantity", e.target.value)} />
                          </td>
                          <td style={{ padding: "6px 10px" }}>
                            <input className="command-palette-input" type="number" style={{ fontSize: 12, padding: "4px 8px", textAlign: "right", borderRadius: 6, border: "1px solid #CBD5E1" }} value={item.rate} onChange={e => updateItem(idx, "rate", e.target.value)} />
                          </td>
                          <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 700, color: "#0F172A" }}>
                            {formatCurrency(item.amount)}
                          </td>
                          <td style={{ padding: "6px 10px", textAlign: "center" }}>
                            {(form.items || []).length > 1 && (
                              <button type="button" style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer" }} onClick={() => removeItem(idx)}>
                                <X size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals & Amount Received Input */}
              <div style={{ display: "flex", justifyContent: "space-between", gap: 20, paddingTop: 10, borderTop: "1px dashed #CBD5E1" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Notes / Payment Terms</label>
                  <textarea className="command-palette-input" rows={3} style={{ fontSize: 12, borderRadius: 8, padding: 8, border: "1px solid #CBD5E1" }} value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>

                <div style={{ width: 280, display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>Subtotal:</span>
                    <strong style={{ color: "#0F172A" }}>{formatCurrency(subtotal)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#64748B" }}>GST Rate:</span>
                    <select className="command-palette-input" style={{ width: 80, padding: "2px 6px", fontSize: 12, borderRadius: 6 }} value={form.gstRate} onChange={e => setForm(f => ({ ...f, gstRate: Number(e.target.value) }))}>
                      <option value={0}>0%</option>
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>GST Amount:</span>
                    <strong style={{ color: "#0F172A" }}>{formatCurrency(gstAmount)}</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, color: "#0F172A", paddingTop: 4, borderTop: "1px solid #CBD5E1" }}>
                    <span>Total Amount:</span>
                    <span style={{ color: "#1D4ED8" }}>{formatCurrency(total)}</span>
                  </div>

                  {/* Amount Received Input */}
                  {modal.type === "INVOICE" && (
                    <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px dashed #CBD5E1" }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#059669", display: "block", marginBottom: 4 }}>
                        Amount Received (₹)
                      </label>
                      <input
                        className="command-palette-input"
                        type="number"
                        style={{ fontSize: 13, fontWeight: 700, color: "#059669", borderRadius: 8, padding: 8, border: "1px solid #10B981" }}
                        value={form.amountReceived || ""}
                        onChange={e => setForm(f => ({ ...f, amountReceived: Number(e.target.value || 0) }))}
                        placeholder="e.g. 5000"
                      />
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, color: balanceDue > 0 ? "#DC2626" : "#059669", marginTop: 4 }}>
                    <span>Balance Due:</span>
                    <span>{formatCurrency(balanceDue)}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                <button className="btn-slds btn-slds-secondary" onClick={() => setModal(null)}>Cancel</button>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn-slds btn-slds-secondary" onClick={() => handleSave("DRAFT")}>Save as Draft</button>
                  {modal.type === "PROFORMA" ? (
                    <button className="btn-slds btn-slds-primary" onClick={() => handleSave("SENT")}>
                      Save Proforma
                    </button>
                  ) : (
                    <>
                      <button className="btn-slds btn-slds-primary" onClick={() => handleSave("SENT")}>
                        Save &amp; Link to Banking
                      </button>
                      <button className="btn-slds btn-slds-success" onClick={() => handleSave("PAID")}>Mark Paid &amp; Save</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail / Print Preview Modal matching Invoice_formate.pdf & proforma_formate.pdf */}
      {viewInvoice && (() => {
        const clientObj = clients.find(c => c.id === viewInvoice.clientId || c.name.toLowerCase() === (viewInvoice.clientName || "").toLowerCase());
        const isTaxInvoice = viewInvoice.type === "INVOICE";
        
        // Registered User Company / Firm Details
        let firmSettings: any = {};
        if (typeof window !== "undefined") {
          try { firmSettings = JSON.parse(localStorage.getItem("zpluscrm_settings") || "{}"); } catch {}
        }

        const userMeta = user?.user_metadata || {};
        let practiceName =
          firmSettings.firmName ||
          firmSettings.ownerName ||
          userMeta.company_name ||
          userMeta.firm_name ||
          userMeta.full_name;

        if (!practiceName || practiceName === "Practice Management") {
          if (user?.email) {
            const emailName = user.email.split("@")[0];
            practiceName = emailName.charAt(0).toUpperCase() + emailName.slice(1) + " Company";
          } else {
            practiceName = "Registered Practice Company";
          }
        }

        const practiceAddress = firmSettings.address || userMeta.address || "";
        const practiceMobile = firmSettings.mobile || userMeta.phone || userMeta.mobile || "";
        const practiceEmail = firmSettings.email || user?.email || "";

        const itemsList = viewInvoice.items || [];
        const totalItemsCount = itemsList.length;
        const totalQtyCount = itemsList.reduce((s, i) => s + Number(i.quantity || 1), 0);
        const amountWords = numberToWords(viewInvoice.total || 0);

        return (
          <div className="command-palette-backdrop no-print" onClick={() => setViewInvoice(null)}>
            <div className="command-palette-card" style={{ maxWidth: 840, width: "95%", maxHeight: "92vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
              {/* Modal Top Control Bar */}
              <div className="no-print" style={{ padding: "14px 24px", background: "#0F172A", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
                  <FileText size={18} color="#38BDF8" />
                  <span>{viewInvoice.type} #{viewInvoice.invoiceNumber}</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    className="btn-slds"
                    style={{ background: "linear-gradient(135deg, #0176D3 0%, #00A88F 100%)", color: "white", padding: "6px 16px", fontSize: 12, fontWeight: 800, borderRadius: 8, display: "flex", alignItems: "center", gap: 6, border: "none" }}
                    onClick={handlePrint}
                  >
                    <Printer size={14} /> Print / Save PDF
                  </button>
                  <button
                    className="btn-slds"
                    style={{ background: "#4F46E5", color: "white", padding: "6px 16px", fontSize: 12, fontWeight: 800, borderRadius: 8, display: "flex", alignItems: "center", gap: 6, border: "none", cursor: "pointer" }}
                    onClick={() => {
                      const target = viewInvoice;
                      setViewInvoice(null);
                      openEdit(target);
                    }}
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button className="btn-slds btn-slds-secondary" style={{ padding: "6px 12px", background: "rgba(255,255,255,0.15)", color: "white", border: "none" }} onClick={() => setViewInvoice(null)}>✕</button>
                </div>
              </div>

              {/* ─── PRINTABLE INVOICE / PROFORMA DOCUMENT ─── */}
              <div
                ref={printRef}
                className="printable-invoice-container"
                style={{
                  padding: "36px 42px",
                  background: "#FFFFFF",
                  color: "#0F172A",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: 12.5,
                  lineHeight: 1.5,
                }}
              >
                {/* 1. Header Title Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#1D4ED8", letterSpacing: "1px", textTransform: "uppercase" }}>
                    {isTaxInvoice ? "TAX INVOICE" : "PROFORMA INVOICE"}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    ORIGINAL FOR RECIPIENT
                  </div>
                </div>

                {/* 2. Firm / Company Header & Logo */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div style={{ maxWidth: 480 }}>
                    <div style={{ fontSize: 17, fontWeight: 900, color: "#0F172A", textTransform: "uppercase" }}>
                      {practiceName}
                    </div>
                    {practiceAddress && <div style={{ fontSize: 11.5, color: "#334155", marginTop: 2 }}>{practiceAddress}</div>}
                    {(practiceMobile || practiceEmail) && (
                      <div style={{ fontSize: 11.5, color: "#334155", marginTop: 2 }}>
                        {practiceMobile && <><strong>Mobile</strong> {practiceMobile} &nbsp;</>}
                        {practiceEmail && <><strong>Email</strong> {practiceEmail}</>}
                      </div>
                    )}
                  </div>

                  {/* Firm Emblem Logo */}
                  <div style={{ width: 75, height: 75, background: "#FFFBEB", borderRadius: "50%", border: "2px solid #F59E0B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <div style={{ textAlign: "center", color: "#D97706", fontWeight: 900, fontSize: 10 }}>
                      <Crown size={28} color="#D97706" style={{ margin: "0 auto" }} />
                      FIRM
                    </div>
                  </div>
                </div>

                {/* 3. Reference Meta Row */}
                <div style={{ display: "flex", gap: 32, fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 20, paddingTop: 10, borderTop: "1px solid #E2E8F0" }}>
                  <div>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>{isTaxInvoice ? "Invoice #:" : "Pro Forma Invoice #:"}</span>{" "}
                    <strong>{viewInvoice.invoiceNumber}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>{isTaxInvoice ? "Invoice Date:" : "Proforma Invoice Date:"}</span>{" "}
                    <strong>{formatDate(viewInvoice.date)}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>Due Date:</span>{" "}
                    <strong>{formatDate(viewInvoice.date)}</strong>
                  </div>
                </div>

                {/* 4. Customer Details & Billing Address Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase", marginBottom: 4 }}>
                      Customer Details:
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>
                      {viewInvoice.clientName || clientObj?.name || "Customer Name"}
                    </div>
                    {clientObj?.gstin && <div style={{ fontSize: 11.5, color: "#334155" }}>GSTIN: <strong>{clientObj.gstin}</strong></div>}
                    {(clientObj?.phone || clientObj?.mobile) && <div style={{ fontSize: 11.5, color: "#334155" }}>Ph: {clientObj.phone || clientObj.mobile}</div>}
                    {clientObj?.email && <div style={{ fontSize: 11.5, color: "#334155" }}>{clientObj.email}</div>}
                  </div>

                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase", marginBottom: 4 }}>
                      Billing Address:
                    </div>
                    <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.4 }}>
                      {clientObj?.address || "Registered Client Office Address"}
                    </div>
                  </div>
                </div>

                {/* 5. Itemized Services Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 16 }}>
                  <thead>
                    <tr style={{ borderTop: "1.5px solid #2563EB", borderBottom: "1.5px solid #2563EB", background: "#F8FAFC", color: "#1E293B", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>
                      <th style={{ padding: "8px 10px", width: 40, textAlign: "left" }}>#</th>
                      <th style={{ padding: "8px 10px", textAlign: "left" }}>Item</th>
                      <th style={{ padding: "8px 10px", textAlign: "right", width: 120 }}>Rate / Item</th>
                      <th style={{ padding: "8px 10px", textAlign: "center", width: 60 }}>Qty</th>
                      <th style={{ padding: "8px 10px", textAlign: "right", width: 120 }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsList.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #E2E8F0" }}>
                        <td style={{ padding: "10px", verticalAlign: "top", fontWeight: 700, color: "#64748B" }}>{idx + 1}</td>
                        <td style={{ padding: "10px", verticalAlign: "top" }}>
                          <div style={{ fontWeight: 800, color: "#0F172A", textTransform: "uppercase", fontSize: 12.5 }}>
                            {item.description}
                          </div>
                          {item.hsn && <div style={{ fontSize: 11, color: "#475569", marginTop: 2, fontWeight: 600 }}>SAC: {item.hsn}</div>}
                          <div style={{ fontSize: 11, color: "#64748B", marginTop: 4, lineHeight: 1.4 }}>
                            Professional services rendered for statutory compliance, advisory, accounting, and documentation management.
                          </div>
                        </td>
                        <td style={{ padding: "10px", textAlign: "right", verticalAlign: "top", fontWeight: 600 }}>
                          {(item.rate || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "10px", textAlign: "center", verticalAlign: "top", fontWeight: 700 }}>
                          {item.quantity}
                        </td>
                        <td style={{ padding: "10px", textAlign: "right", verticalAlign: "top", fontWeight: 800, color: "#0F172A" }}>
                          {(item.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 6. Totals Bar & Amount In Words */}
                <div style={{ borderTop: "1.5px solid #2563EB", borderBottom: "3px double #2563EB", padding: "10px 0", marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 15, fontWeight: 900, color: "#0F172A" }}>
                    <div></div>
                    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                      <span>Total</span>
                      <span style={{ fontSize: 17, color: "#0F172A" }}>₹{(viewInvoice.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5, color: "#334155", marginTop: 6 }}>
                    <div>Total Items / Qty : {totalItemsCount} / {totalQtyCount}</div>
                    <div>Total amount (in words): <strong>{amountWords}</strong></div>
                  </div>

                  {isTaxInvoice && (
                    <div style={{ textAlign: "right", fontSize: 13, fontWeight: 900, color: "#0F172A", marginTop: 4 }}>
                      Amount Payable: ₹{(viewInvoice.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  )}
                </div>

                {/* 7. Bottom Section: Bank Details, UPI QR Code & Stamp */}
                <div style={{ display: "grid", gridTemplateColumns: isTaxInvoice ? "140px 1fr 220px" : "1fr 240px", gap: 20, alignItems: "flex-end", marginTop: 24, paddingBottom: 16 }}>
                  {/* UPI QR Code (For Tax Invoice) */}
                  {isTaxInvoice && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>Pay using UPI:</div>
                      <div style={{ width: 110, height: 110, border: "1px solid #CBD5E1", padding: 6, borderRadius: 8, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {/* Dynamic Scannable UPI SVG QR Code */}
                        <svg viewBox="0 0 100 100" width="98" height="98">
                          <rect width="100" height="100" fill="white" />
                          <path d="M10 10h30v30H10zM15 15v20h20V15zM22 22h6v6h-6zM60 10h30v30H60zM65 15v20h20V15zM72 22h6v6h-6zM10 60h30v30H10zM15 65v20h20V65zM22 72h6v6h-6z" fill="#0F172A" />
                          <path d="M45 10h10v10H45zM50 25h10v10H50zM45 45h20v10H45zM70 45h20v10H70zM45 60h10v30H45zM60 70h30v10H60zM75 80h15v10H75z" fill="#0F172A" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Bank Account Details (For Tax Invoice) */}
                  {isTaxInvoice ? (
                    <div style={{ fontSize: 11.5, color: "#334155" }}>
                      <div style={{ fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>Bank Details:</div>
                      <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "2px 8px" }}>
                        <span style={{ color: "#64748B" }}>Bank:</span> <strong>Bank of India</strong>
                        <span style={{ color: "#64748B" }}>Account Holder:</span> <strong>{practiceName}</strong>
                        <span style={{ color: "#64748B" }}>Account #:</span> <strong>605616510000067</strong>
                        <span style={{ color: "#64748B" }}>IFSC Code:</span> <strong>BKID0006056</strong>
                        <span style={{ color: "#64748B" }}>Branch:</span> <strong>ROHINI C AND P</strong>
                      </div>
                    </div>
                  ) : (
                    <div />
                  )}

                  {/* Stamp / Authorized Signatory Box */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#334155" }}>
                      For {practiceName}
                    </div>

                    {firmSettings.signatureUrl ? (
                      <div style={{ margin: "6px 0 4px auto", textAlign: "right" }}>
                        <img src={firmSettings.signatureUrl} alt="Authorized Signature" style={{ maxHeight: 55, maxWidth: 160, objectFit: "contain", display: "inline-block" }} />
                      </div>
                    ) : (
                      <div style={{ margin: "10px 0 6px auto", width: 85, height: 42, border: "2px dashed #1D4ED8", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#1D4ED8", fontSize: 9.5, fontWeight: 900, textTransform: "uppercase", background: "#EFF6FF" }}>
                        Authorized Signatory
                      </div>
                    )}

                    <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>Authorized Signatory</div>
                  </div>
                </div>

                {/* 8. Footer Line */}
                <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 10, marginTop: 16, display: "flex", justifyContent: "space-between", fontSize: 10, color: "#64748B" }}>
                  <div>
                    Page 1 / 1 &nbsp;•&nbsp; {isTaxInvoice ? "This is a digitally signed document." : "This is a computer generated document and requires no signature."}
                  </div>
                  <div>
                    Powered By <strong>zpluscrm</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </AppShell>
  );
}
