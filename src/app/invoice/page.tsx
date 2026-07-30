"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo, useRef } from "react";
import { formatCurrency } from "@/lib/utils";
import { Plus, Printer, Download, Send, Eye, X, IndianRupee, FileText, Building2, User } from "lucide-react";
import { toast } from "sonner";

type InvoiceType = "PROFORMA" | "INVOICE";

interface InvoiceItem {
  id: string;
  description: string;
  hsn: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Invoice {
  id: string;
  type: InvoiceType;
  invoiceNumber: string;
  date: string;
  clientId: string;
  items: InvoiceItem[];
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  total: number;
  notes: string;
  status: "DRAFT" | "SENT" | "PAID";
  createdAt: string;
}

const defaultItem = (): InvoiceItem => ({
  id: `item_${Date.now()}`,
  description: "",
  hsn: "",
  quantity: 1,
  rate: 0,
  amount: 0,
});

const FIRM_NAME = "zpluscrm Practice";
const FIRM_ADDRESS = "Your Office Address, City - PIN";
const FIRM_GSTIN = "YOUR_GSTIN";
const FIRM_PAN = "YOUR_PAN";
const FIRM_PHONE = "+91 XXXXXXXXXX";
const FIRM_EMAIL = "contact@zpluscrm.com";

export default function InvoicePage() {
  const { clients } = useAppStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [modal, setModal] = useState<{ open: boolean; type: InvoiceType } | null>(null);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [form, setForm] = useState<Partial<Invoice>>({
    type: "PROFORMA",
    date: new Date().toISOString().split("T")[0],
    clientId: "",
    items: [defaultItem()],
    gstRate: 18,
    notes: "",
    status: "DRAFT",
  });
  const printRef = useRef<HTMLDivElement>(null);

  const invoiceCount = invoices.filter(i => i.type === "INVOICE").length;
  const proformaCount = invoices.filter(i => i.type === "PROFORMA").length;

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
      clientId: "",
      items: [defaultItem()],
      gstRate: 18,
      notes: "",
      status: "DRAFT",
    });
    setModal({ open: true, type });
  };

  const updateItem = (idx: number, field: keyof InvoiceItem, value: any) => {
    setForm(f => {
      const items = [...(f.items || [])];
      items[idx] = { ...items[idx], [field]: value };
      if (field === "quantity" || field === "rate") {
        items[idx].amount = Number(items[idx].quantity) * Number(items[idx].rate);
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

  const handleSave = (status: "DRAFT" | "SENT") => {
    if (!form.clientId) { toast.error("Please select a client"); return; }
    const invoice: Invoice = {
      ...form as Invoice,
      id: `inv_${Date.now()}`,
      subtotal,
      gstAmount,
      total,
      status,
      createdAt: new Date().toISOString(),
    };
    setInvoices(prev => [invoice, ...prev]);
    setModal(null);
    toast.success(`${status === "SENT" ? "Invoice sent!" : "Draft saved!"}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const statusConfig = {
    DRAFT: { bg: "#F1F5F9", color: "#64748B", label: "Draft" },
    SENT: { bg: "#FFFBEB", color: "#D97706", label: "Sent" },
    PAID: { bg: "#F0FDF4", color: "#059669", label: "Paid" },
  };

  return (
    <AppShell title="Invoices" subtitle="Create Proforma Invoices and Tax Invoices">
      {/* Header */}
      <div className="page-header-slds">
        <div>
          <div className="breadcrumb"><span>zpluscrm</span><span>/</span><span className="current">Invoices</span></div>
          <div className="page-title-slds">Invoice & Proforma Generator</div>
          <div className="page-subtitle-slds">Generate professional invoices and proforma for client billing.</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-slds btn-slds-secondary" onClick={() => openCreate("PROFORMA")}>
            <FileText size={15} /><span>New Proforma</span>
          </button>
          <button className="btn-slds btn-slds-primary" onClick={() => openCreate("INVOICE")}>
            <Plus size={15} /><span>New Invoice</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Total Invoices", value: invoiceCount, color: "#1D4ED8", bg: "#EFF6FF" },
          { label: "Proforma Invoices", value: proformaCount, color: "#6D28D9", bg: "#F5F3FF" },
          { label: "Total Value", value: formatCurrency(invoices.filter(i => i.status === "PAID").reduce((s, i) => s + i.total, 0)), color: "#059669", bg: "#F0FDF4" },
        ].map(stat => (
          <div key={stat.label} style={{ background: stat.bg, border: `1px solid ${stat.bg}`, borderRadius: 14, padding: "16px 20px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: stat.color, textTransform: "uppercase" }}>{stat.label}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: stat.color, marginTop: 4 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Table of all invoices */}
      <div className="data-table-wrapper">
        <div className="data-table-header">
          <div className="data-table-title">All Invoices & Proformas</div>
        </div>
        <div className="table-scroll-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Invoice No.</th>
                <th>Type</th>
                <th>Client</th>
                <th>Date</th>
                <th className="col-right">Subtotal</th>
                <th className="col-right">GST</th>
                <th className="col-right">Total</th>
                <th>Status</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => {
                const client = clients.find(c => c.id === inv.clientId);
                const cfg = statusConfig[inv.status];
                return (
                  <tr key={inv.id}>
                    <td className="col-num">{i + 1}</td>
                    <td style={{ fontWeight: 700, color: "#0F172A", fontFamily: "monospace" }}>{inv.invoiceNumber}</td>
                    <td>
                      <span className="badge" style={{
                        background: inv.type === "INVOICE" ? "#EFF6FF" : "#F5F3FF",
                        color: inv.type === "INVOICE" ? "#1D4ED8" : "#6D28D9"
                      }}>
                        {inv.type === "INVOICE" ? "Tax Invoice" : "Proforma"}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{client?.name || "-"}</td>
                    <td>{inv.date}</td>
                    <td className="col-right">{formatCurrency(inv.subtotal)}</td>
                    <td className="col-right" style={{ color: "#64748B" }}>{formatCurrency(inv.gstAmount)}</td>
                    <td className="col-right" style={{ fontWeight: 800, color: "#059669" }}>{formatCurrency(inv.total)}</td>
                    <td>
                      <span style={{ background: cfg.bg, color: cfg.color, padding: "3px 10px", borderRadius: 6, fontWeight: 700, fontSize: 12 }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="col-actions">
                      <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
                        <button
                          className="btn-slds btn-slds-primary"
                          style={{ padding: "4px 8px", fontSize: 11 }}
                          onClick={() => setViewInvoice(inv)}
                          title="Preview"
                        >
                          <Eye size={13} />
                        </button>
                        {inv.status === "DRAFT" && (
                          <button
                            className="btn-slds btn-slds-secondary"
                            style={{ padding: "4px 8px", fontSize: 11, color: "#059669" }}
                            onClick={() => {
                              setInvoices(prev => prev.map(x => x.id === inv.id ? { ...x, status: "PAID" } : x));
                              toast.success("Marked as Paid");
                            }}
                            title="Mark as Paid"
                          >
                            ✓ Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={10} className="empty-table-cell">
                    No invoices yet. Click "New Invoice" or "New Proforma" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Preview / Print Modal */}
      {viewInvoice && (
        <div className="command-palette-backdrop" onClick={() => setViewInvoice(null)}>
          <div style={{ background: "white", borderRadius: 16, maxWidth: 720, width: "100%", maxHeight: "90vh", overflow: "auto", position: "relative" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "white", zIndex: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Invoice Preview — {viewInvoice.invoiceNumber}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-slds btn-slds-primary" style={{ padding: "6px 14px" }} onClick={handlePrint}>
                  <Printer size={14} /> Print / PDF
                </button>
                <button className="btn-slds btn-slds-secondary" style={{ padding: "6px 10px" }} onClick={() => setViewInvoice(null)}>
                  <X size={15} />
                </button>
              </div>
            </div>
            <InvoiceTemplate invoice={viewInvoice} client={clients.find(c => c.id === viewInvoice.clientId)} />
          </div>
        </div>
      )}

      {/* Create Invoice / Proforma Modal */}
      {modal?.open && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 700, maxHeight: "90vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: modal.type === "INVOICE" ? "#0F172A" : "#2D1B69", color: "white", borderRadius: "16px 16px 0 0" }}>
              <div>
                <div className="modal-title" style={{ color: "white" }}>
                  {modal.type === "INVOICE" ? "Create Tax Invoice" : "Create Proforma Invoice"}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
                  {form.invoiceNumber}
                </div>
              </div>
              <button style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", padding: "4px 10px", borderRadius: 6, cursor: "pointer" }} onClick={() => setModal(null)}>✕</button>
            </div>

            <div className="modal-body" style={{ display: "grid", gap: 16 }}>
              {/* Header Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Client *</label>
                  <select className="form-select" value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}>
                    <option value="">Select client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">GST Rate (%)</label>
                  <select className="form-select" value={form.gstRate} onChange={e => setForm(f => ({ ...f, gstRate: Number(e.target.value) }))}>
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", marginBottom: 8 }}>Line Items</div>
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#F1F5F9" }}>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748B" }}>Description</th>
                        <th style={{ padding: "8px 12px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#64748B", width: 80 }}>HSN</th>
                        <th style={{ padding: "8px 12px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#64748B", width: 70 }}>Qty</th>
                        <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 11, fontWeight: 700, color: "#64748B", width: 100 }}>Rate (₹)</th>
                        <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 11, fontWeight: 700, color: "#64748B", width: 100 }}>Amount (₹)</th>
                        <th style={{ width: 36 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(form.items || []).map((item, idx) => (
                        <tr key={item.id} style={{ borderTop: "1px solid #E2E8F0" }}>
                          <td style={{ padding: "6px 8px" }}>
                            <input
                              className="form-input"
                              style={{ fontSize: 12, padding: "5px 8px" }}
                              value={item.description}
                              onChange={e => updateItem(idx, "description", e.target.value)}
                              placeholder="Service description"
                            />
                          </td>
                          <td style={{ padding: "6px 8px" }}>
                            <input
                              className="form-input"
                              style={{ fontSize: 12, padding: "5px 8px", textAlign: "center" }}
                              value={item.hsn}
                              onChange={e => updateItem(idx, "hsn", e.target.value)}
                              placeholder="998311"
                            />
                          </td>
                          <td style={{ padding: "6px 8px" }}>
                            <input
                              className="form-input"
                              type="number"
                              style={{ fontSize: 12, padding: "5px 8px", textAlign: "center" }}
                              value={item.quantity}
                              onChange={e => updateItem(idx, "quantity", Number(e.target.value))}
                            />
                          </td>
                          <td style={{ padding: "6px 8px" }}>
                            <input
                              className="form-input"
                              type="number"
                              style={{ fontSize: 12, padding: "5px 8px", textAlign: "right" }}
                              value={item.rate || ""}
                              onChange={e => updateItem(idx, "rate", Number(e.target.value))}
                              placeholder="0"
                            />
                          </td>
                          <td style={{ padding: "6px 12px", textAlign: "right", fontWeight: 700, fontSize: 13, color: "#0F172A" }}>
                            {formatCurrency(item.amount)}
                          </td>
                          <td style={{ padding: "6px 4px" }}>
                            {(form.items || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", padding: "4px" }}
                              >
                                <X size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className="btn-slds btn-slds-secondary" style={{ marginTop: 10, fontSize: 12 }} onClick={addItem}>
                  <Plus size={13} /> Add Line Item
                </button>
              </div>

              {/* Totals */}
              <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 4 }}>
                  <span style={{ color: "#374151", fontSize: 13 }}>Subtotal:</span>
                  <span style={{ fontWeight: 700, textAlign: "right", color: "#0F172A" }}>{formatCurrency(subtotal)}</span>
                  <span style={{ color: "#374151", fontSize: 13 }}>GST ({form.gstRate}%):</span>
                  <span style={{ fontWeight: 700, textAlign: "right", color: "#0F172A" }}>{formatCurrency(gstAmount)}</span>
                  <span style={{ color: "#166534", fontSize: 15, fontWeight: 800, borderTop: "1px solid #BBF7D0", paddingTop: 6, marginTop: 4 }}>Total:</span>
                  <span style={{ fontWeight: 900, fontSize: 18, color: "#15803D", textAlign: "right", borderTop: "1px solid #BBF7D0", paddingTop: 6, marginTop: 4 }}>
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">Notes / Terms</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: 70, resize: "vertical" }}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Payment due within 30 days. Thank you for your business!"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-slds btn-slds-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-slds btn-slds-secondary" onClick={() => handleSave("DRAFT")} style={{ color: "#D97706" }}>
                Save as Draft
              </button>
              <button className="btn-slds btn-slds-primary" onClick={() => handleSave("SENT")}>
                <Send size={14} /> Save & Send
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function InvoiceTemplate({ invoice, client }: { invoice: Invoice; client: any }) {
  const gstRate = invoice.gstRate || 18;
  const cgst = invoice.gstAmount / 2;
  const sgst = invoice.gstAmount / 2;

  return (
    <div style={{ padding: "32px 40px", fontFamily: "Arial, sans-serif", color: "#0F172A", minHeight: 800 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, borderBottom: "3px solid #0176D3", paddingBottom: 20 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0F172A" }}>
            <span style={{ color: "#0F172A" }}>zplus</span>
            <span style={{ color: "#54B400" }}>crm</span>
          </div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>Practice Management</div>
          <div style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>{FIRM_ADDRESS}</div>
          <div style={{ fontSize: 12, color: "#374151" }}>GSTIN: {FIRM_GSTIN} | PAN: {FIRM_PAN}</div>
          <div style={{ fontSize: 12, color: "#374151" }}>{FIRM_PHONE} | {FIRM_EMAIL}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0176D3" }}>
            {invoice.type === "INVOICE" ? "TAX INVOICE" : "PROFORMA INVOICE"}
          </div>
          <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>No: {invoice.invoiceNumber}</div>
          <div style={{ fontSize: 13, color: "#64748B" }}>Date: {invoice.date}</div>
        </div>
      </div>

      {/* Bill To */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: 6 }}>Bill To</div>
        <div style={{ padding: "12px 16px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{client?.name || "Client Name"}</div>
          <div style={{ fontSize: 12, color: "#64748B" }}>{client?.type?.replace(/_/g, " ") || ""}</div>
          {client?.gstin && <div style={{ fontSize: 12, color: "#374151" }}>GSTIN: {client.gstin}</div>}
          {client?.pan && <div style={{ fontSize: 12, color: "#374151" }}>PAN: {client.pan}</div>}
          {(client as any)?.address && <div style={{ fontSize: 12, color: "#374151" }}>{(client as any).address}</div>}
        </div>
      </div>

      {/* Items Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20, fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#0F172A", color: "white" }}>
            <th style={{ padding: "10px 12px", textAlign: "left", borderRadius: "8px 0 0 0" }}>#</th>
            <th style={{ padding: "10px 12px", textAlign: "left" }}>Description</th>
            <th style={{ padding: "10px 12px", textAlign: "center" }}>HSN</th>
            <th style={{ padding: "10px 12px", textAlign: "center" }}>Qty</th>
            <th style={{ padding: "10px 12px", textAlign: "right" }}>Rate (₹)</th>
            <th style={{ padding: "10px 12px", textAlign: "right", borderRadius: "0 8px 0 0" }}>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, i) => (
            <tr key={item.id} style={{ background: i % 2 === 0 ? "#F8FAFC" : "#FFFFFF" }}>
              <td style={{ padding: "10px 12px", borderBottom: "1px solid #E2E8F0" }}>{i + 1}</td>
              <td style={{ padding: "10px 12px", borderBottom: "1px solid #E2E8F0" }}>{item.description}</td>
              <td style={{ padding: "10px 12px", borderBottom: "1px solid #E2E8F0", textAlign: "center" }}>{item.hsn}</td>
              <td style={{ padding: "10px 12px", borderBottom: "1px solid #E2E8F0", textAlign: "center" }}>{item.quantity}</td>
              <td style={{ padding: "10px 12px", borderBottom: "1px solid #E2E8F0", textAlign: "right" }}>{item.rate.toLocaleString("en-IN")}</td>
              <td style={{ padding: "10px 12px", borderBottom: "1px solid #E2E8F0", textAlign: "right", fontWeight: 700 }}>{item.amount.toLocaleString("en-IN")}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, background: "#F1F5F9" }}>Subtotal:</td>
            <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, background: "#F1F5F9" }}>{invoice.subtotal.toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td colSpan={5} style={{ padding: "8px 12px", textAlign: "right", color: "#64748B" }}>CGST ({gstRate / 2}%):</td>
            <td style={{ padding: "8px 12px", textAlign: "right", color: "#64748B" }}>{cgst.toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td colSpan={5} style={{ padding: "8px 12px", textAlign: "right", color: "#64748B" }}>SGST ({gstRate / 2}%):</td>
            <td style={{ padding: "8px 12px", textAlign: "right", color: "#64748B" }}>{sgst.toLocaleString("en-IN")}</td>
          </tr>
          <tr style={{ background: "#0F172A", color: "white" }}>
            <td colSpan={5} style={{ padding: "12px 12px", textAlign: "right", fontWeight: 800, fontSize: 15 }}>Total:</td>
            <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 900, fontSize: 16 }}>₹ {invoice.total.toLocaleString("en-IN")}</td>
          </tr>
        </tfoot>
      </table>

      {/* Notes */}
      {invoice.notes && (
        <div style={{ marginTop: 16, padding: "12px 16px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: 4 }}>Notes & Terms</div>
          <div style={{ fontSize: 12, color: "#374151" }}>{invoice.notes}</div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ fontSize: 11, color: "#94A3B8" }}>
          Generated by zpluscrm Practice Management System
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ height: 40, width: 160, borderBottom: "1px solid #0F172A" }}></div>
          <div style={{ fontSize: 11, color: "#64748B", marginTop: 6 }}>Authorized Signature</div>
        </div>
      </div>
    </div>
  );
}
