"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo, useRef } from "react";
import { formatCurrency, getCurrentFY, getFYOptions } from "@/lib/utils";
import { Invoice, InvoiceItem, InvoiceType } from "@/lib/types";
import { Plus, Printer, Eye, X, IndianRupee, FileText, Filter, CheckCircle2, AlertCircle, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
  const { clients, invoices, selectedFY, addInvoice, updateInvoice, deleteInvoice } = useAppStore();

  const [entityFilter, setEntityFilter] = useState<"ALL" | "PROFORMA" | "INVOICE">("ALL");
  const [modal, setModal] = useState<{ open: boolean; type: InvoiceType } | null>(null);
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

  const invoiceCount = useMemo(() => invoices.filter(i => i.type === "INVOICE").length, [invoices]);
  const proformaCount = useMemo(() => invoices.filter(i => i.type === "PROFORMA").length, [invoices]);

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
    setModal({ open: true, type });
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
  const gstAmount = useMemo(() => (subtotal * (form.gstRate || 18)) / 100, [subtotal, form.gstRate]);
  const total = useMemo(() => subtotal + gstAmount, [subtotal, gstAmount]);
  const balanceDue = useMemo(() => Math.max(0, total - (form.amountReceived || 0)), [total, form.amountReceived]);

  const handleSave = (status: "DRAFT" | "SENT" | "PAID") => {
    if (!form.clientId) {
      toast.error("Please select a client");
      return;
    }
    const clientObj = clients.find(c => c.id === form.clientId);
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

    if (form.id) {
      updateInvoice(invoiceRecord);
      toast.success(`${invoiceRecord.type} #${invoiceRecord.invoiceNumber} updated & saved!`);
    } else {
      addInvoice(invoiceRecord);
      toast.success(`${invoiceRecord.type} #${invoiceRecord.invoiceNumber} created & linked to Banking Ledger!`);
    }

    setModal(null);
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (entityFilter === "PROFORMA") return inv.type === "PROFORMA";
      if (entityFilter === "INVOICE") return inv.type === "INVOICE";
      return true;
    });
  }, [invoices, entityFilter]);

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
    <AppShell title="Invoices & Proformas" subtitle="Generate, filter, and track tax invoices & proformas with banking linkage">
      <div className="data-table-wrapper">
        <div className="data-table-header">
          {/* Entity Filter Toolbar (All, Proforma, Invoice) */}
          <div className="toolbar-controls" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#64748B", display: "flex", alignItems: "center", gap: 6 }}>
              <Filter size={14} /> Entity Filter:
            </div>
            <div style={{ display: "flex", gap: 4, background: "#F1F5F9", padding: 3, borderRadius: 8 }}>
              {(["ALL", "PROFORMA", "INVOICE"] as const).map(type => (
                <button
                  key={type}
                  className="btn-slds"
                  style={{
                    padding: "5px 14px",
                    fontSize: 12,
                    fontWeight: 700,
                    borderRadius: 6,
                    border: "none",
                    background: entityFilter === type ? "#0F172A" : "transparent",
                    color: entityFilter === type ? "#FFFFFF" : "#64748B",
                  }}
                  onClick={() => setEntityFilter(type)}
                >
                  {type === "ALL" ? `All (${invoices.length})` : type === "PROFORMA" ? `Proforma (${proformaCount})` : `Invoice (${invoiceCount})`}
                </button>
              ))}
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

        {/* Table of Invoices & Proformas */}
        <div className="table-scroll-container">
          <table>
            <thead>
              <tr>
                <th className="col-num">#</th>
                <th>Type</th>
                <th>Doc #</th>
                <th>Financial Year</th>
                <th>Client Name</th>
                <th>Date</th>
                <th>Total Amount</th>
                <th>Amount Received</th>
                <th>Balance Due</th>
                <th>Status</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv, i) => {
                const clientObj = clients.find(c => c.id === inv.clientId);
                const clientName = inv.clientName || clientObj?.name || "-";
                const cfg = statusConfig[inv.status || "DRAFT"];
                const rcv = inv.amountReceived || 0;
                const bal = inv.balanceDue !== undefined ? inv.balanceDue : Math.max(0, inv.total - rcv);

                return (
                  <tr key={inv.id}>
                    <td className="col-num">{i + 1}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: inv.type === "INVOICE" ? "#EFF6FF" : "#FFF7ED",
                          color: inv.type === "INVOICE" ? "#1D4ED8" : "#C2410C",
                          fontWeight: 700,
                        }}
                      >
                        {inv.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: "#0F172A", fontFamily: "monospace" }}>{inv.invoiceNumber}</td>
                    <td><span className="chip" style={{ background: "#F1F5F9", color: "#334155" }}>FY {inv.financialYear || getCurrentFY()}</span></td>
                    <td style={{ fontWeight: 800, color: "#0F172A" }}>{clientName}</td>
                    <td style={{ fontSize: 13, color: "#475569" }}>{inv.date}</td>
                    <td style={{ fontWeight: 700, color: "#0F172A" }}>{formatCurrency(inv.total)}</td>
                    <td style={{ fontWeight: 700, color: "#059669" }}>{formatCurrency(rcv)}</td>
                    <td style={{ fontWeight: 700, color: bal > 0 ? "#DC2626" : "#059669" }}>{formatCurrency(bal)}</td>
                    <td>
                      <span className="badge" style={{ background: cfg.bg, color: cfg.color, fontWeight: 700 }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="col-actions">
                      <div style={{ display: "flex", gap: 6, justifyContent: "center", alignItems: "center" }}>
                        {inv.type === "PROFORMA" && (
                          <button
                            className="btn-slds btn-slds-primary"
                            style={{ padding: "4px 10px", fontSize: 11, fontWeight: 700, background: "#2563EB" }}
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
                            title="Convert this Proforma to Tax Invoice"
                          >
                            <RefreshCw size={12} style={{ marginRight: 4 }} />
                            Convert to Invoice
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
                          className="btn-slds btn-slds-secondary"
                          style={{ padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "#DC2626", borderColor: "#FCA5A5" }}
                          onClick={() => {
                            if (confirm(`Delete ${inv.type} #${inv.invoiceNumber}? This will automatically remove its entry from Banking & Ledger as well.`)) {
                              deleteInvoice(inv.id);
                              toast.success(`${inv.type} #${inv.invoiceNumber} deleted and removed from Banking & Ledger!`);
                            }
                          }}
                          title="Delete document and remove from Banking & Ledger"
                        >
                          <Trash2 size={13} style={{ marginRight: 4 }} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={11} className="empty-table-cell">
                    No {entityFilter === "ALL" ? "invoices or proformas" : entityFilter.toLowerCase() + "s"} found. Click above to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Invoice & Proforma Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 780, width: "95%" }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                {modal.type === "INVOICE" ? "Create Tax Invoice" : "Create Proforma Invoice"}
              </div>
              <button className="btn-slds btn-slds-secondary" style={{ padding: "4px 8px" }} onClick={() => setModal(null)}>✕</button>
            </div>

            <div className="modal-body" style={{ display: "grid", gap: 16, maxHeight: "78vh", overflowY: "auto" }}>
              {/* Row 1: Document #, Date, Financial Year */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Document Number</label>
                  <input className="form-input" value={form.invoiceNumber || ""} readOnly style={{ background: "#F1F5F9" }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Document Date *</label>
                  <input className="form-input" type="date" value={form.date || ""} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Financial Year *</label>
                  <select className="form-select" value={form.financialYear || selectedFY} onChange={e => setForm(f => ({ ...f, financialYear: e.target.value }))}>
                    {fyOptions.map(fy => <option key={fy} value={fy}>FY {fy}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2: Client Name */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Client Name *</label>
                <select className="form-select" value={form.clientId || ""} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}>
                  <option value="">Select a client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.pan ? `(PAN: ${c.pan})` : ""}</option>
                  ))}
                </select>
              </div>

              {/* Items Table with Pre-built Description Dropdown Options */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>Service Items / Particulars</label>
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
                            {/* Pre-built Description Options Dropdown + Input */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              <select
                                className="form-select"
                                style={{ fontSize: 12, padding: "4px 8px", marginBottom: 2 }}
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
                                className="form-input"
                                style={{ fontSize: 12, padding: "4px 8px" }}
                                value={item.description}
                                onChange={e => updateItem(idx, "description", e.target.value)}
                                placeholder="Service description..."
                              />
                            </div>
                          </td>
                          <td style={{ padding: "6px 10px" }}>
                            <input className="form-input" style={{ fontSize: 12, padding: "4px 8px" }} value={item.hsn} onChange={e => updateItem(idx, "hsn", e.target.value)} placeholder="998311" />
                          </td>
                          <td style={{ padding: "6px 10px" }}>
                            <input className="form-input" type="number" style={{ fontSize: 12, padding: "4px 8px", textAlign: "center" }} value={item.quantity} onChange={e => updateItem(idx, "quantity", e.target.value)} />
                          </td>
                          <td style={{ padding: "6px 10px" }}>
                            <input className="form-input" type="number" style={{ fontSize: 12, padding: "4px 8px", textAlign: "right" }} value={item.rate} onChange={e => updateItem(idx, "rate", e.target.value)} />
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
                  <label className="form-label" style={{ fontWeight: 700 }}>Notes / Payment Terms</label>
                  <textarea className="form-input" rows={3} style={{ fontSize: 12 }} value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>

                <div style={{ width: 280, display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>Subtotal:</span>
                    <strong style={{ color: "#0F172A" }}>{formatCurrency(subtotal)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#64748B" }}>GST Rate:</span>
                    <select className="form-select" style={{ width: 80, padding: "2px 6px", fontSize: 12 }} value={form.gstRate} onChange={e => setForm(f => ({ ...f, gstRate: Number(e.target.value) }))}>
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

                  {/* Amount Received Input — Hidden for Proforma */}
                  {modal.type === "INVOICE" && (
                    <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px dashed #CBD5E1" }}>
                      <label className="form-label" style={{ fontWeight: 700, fontSize: 12, color: "#059669" }}>
                        Amount Received (₹)
                      </label>
                      <input
                        className="form-input"
                        type="number"
                        style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}
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
            </div>

            <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="btn-slds btn-slds-secondary" onClick={() => setModal(null)}>Cancel</button>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-slds btn-slds-secondary" onClick={() => handleSave("DRAFT")}>Save as Draft</button>
                <button className="btn-slds btn-slds-primary" onClick={() => handleSave("SENT")}>
                  {modal.type === "PROFORMA" ? "Save Proforma & Link Banking" : "Save & Link to Banking"}
                </button>
                {modal.type === "INVOICE" && (
                  <button className="btn-slds btn-slds-success" onClick={() => handleSave("PAID")}>Mark Paid & Save</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail / Print Preview Modal */}
      {viewInvoice && (
        <div className="modal-overlay" onClick={() => setViewInvoice(null)}>
          <div className="modal" style={{ maxWidth: 740, width: "95%" }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: "#0F172A", color: "white" }}>
              <div className="modal-title">{viewInvoice.type} #{viewInvoice.invoiceNumber}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-slds btn-slds-primary" style={{ padding: "4px 10px", fontSize: 12 }} onClick={handlePrint}>
                  <Printer size={13} /> Print / Save PDF
                </button>
                <button className="btn-slds btn-slds-secondary" style={{ padding: "4px 8px", background: "rgba(255,255,255,0.2)", color: "white" }} onClick={() => setViewInvoice(null)}>✕</button>
              </div>
            </div>

            <div className="modal-body" ref={printRef} style={{ padding: 32, background: "white", color: "#0F172A", fontFamily: "sans-serif" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                  <h1 style={{ fontSize: 24, fontWeight: 900, color: "#1E293B", margin: 0 }}>zpluscrm Practice</h1>
                  <p style={{ fontSize: 12, color: "#64748B", margin: "4px 0 0" }}>Chartered Accountants & Practice Management</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: viewInvoice.type === "INVOICE" ? "#1D4ED8" : "#C2410C" }}>
                    {viewInvoice.type === "INVOICE" ? "TAX INVOICE" : "PROFORMA INVOICE"}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginTop: 4 }}>#{viewInvoice.invoiceNumber}</div>
                  <div style={{ fontSize: 12, color: "#64748B" }}>Date: {viewInvoice.date}</div>
                  <div style={{ fontSize: 12, color: "#64748B" }}>FY: {viewInvoice.financialYear || getCurrentFY()}</div>
                </div>
              </div>

              {/* Billed To Client Details */}
              <div style={{ background: "#F8FAFC", padding: 16, borderRadius: 8, marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Billed To Client</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginTop: 4 }}>
                  {viewInvoice.clientName || clients.find(c => c.id === viewInvoice.clientId)?.name}
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", marginBottom: 24 }}>
                <thead>
                  <tr style={{ background: "#0F172A", color: "white", textTransform: "uppercase", fontSize: 11, fontWeight: 700 }}>
                    <th style={{ padding: "10px 12px", textAlign: "left" }}># Description</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", width: 80 }}>Qty</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", width: 110 }}>Rate</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", width: 120 }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewInvoice.items || []).map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #E2E8F0" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>{item.description}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>{item.quantity}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>{formatCurrency(item.rate)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
                <div style={{ width: 280, fontSize: 13, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal:</span><strong>{formatCurrency(viewInvoice.subtotal)}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>GST ({viewInvoice.gstRate}%):</span><strong>{formatCurrency(viewInvoice.gstAmount)}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: "#0F172A", borderTop: "2px solid #0F172A", paddingTop: 6 }}>
                    <span>Total Amount:</span><span>{formatCurrency(viewInvoice.total)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#059669", fontWeight: 700 }}>
                    <span>Amount Received:</span><span>{formatCurrency(viewInvoice.amountReceived || 0)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: (viewInvoice.balanceDue || 0) > 0 ? "#DC2626" : "#059669", fontWeight: 800 }}>
                    <span>Balance Due:</span><span>{formatCurrency(viewInvoice.balanceDue !== undefined ? viewInvoice.balanceDue : Math.max(0, viewInvoice.total - (viewInvoice.amountReceived || 0)))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
