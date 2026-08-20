"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { formatCurrency, ensureUUID, getCurrentFY } from "@/lib/utils";
import { Pencil, Check, X, Download, Search, CheckCircle2, Clock, AlertCircle, IndianRupee } from "lucide-react";
import { toast } from "sonner";

type PaymentStatus = "PAID" | "PARTIAL" | "PENDING";

const paymentStatusConfig: Record<PaymentStatus, { label: string; color: string; bg: string; border: string; icon: typeof CheckCircle2 }> = {
  PAID: { label: "Paid", color: "#059669", bg: "#F0FDF4", border: "#6EE7B7", icon: CheckCircle2 },
  PARTIAL: { label: "Partial", color: "#D97706", bg: "#FFFBEB", border: "#FCD34D", icon: Clock },
  PENDING: { label: "Pending", color: "#DC2626", bg: "#FEF2F2", border: "#FCA5A5", icon: AlertCircle },
};

export default function BankingPage() {
  const { bankingEntries, assignedServices, clients, services, subServices, selectedFY, updateBankingEntry } = useAppStore();
  const [editId, setEditId] = useState<string | null>(null);
  const [editRemark, setEditRemark] = useState("");
  const [editReceived, setEditReceived] = useState<string>("0");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    // Only show banking entries from Invoices (exclude assigned service auto-derivations)
    const list = [...bankingEntries.filter(b => (b.financialYear === selectedFY || (!b.financialYear && selectedFY === getCurrentFY())) && b.remark !== "Assigned service billing record")];

    // Apply search filter
    return list.filter(b => {
      const client = clients.find(c => c.id === b.clientId || (b.clientId && ensureUUID(c.id) === ensureUUID(b.clientId)));
      const service = services.find(s => s.id === b.serviceId || (b.serviceId && ensureUUID(s.id) === ensureUUID(b.serviceId)));
      const q = search.toLowerCase();
      return (
        (client?.name || "").toLowerCase().includes(q) ||
        (service?.name || "").toLowerCase().includes(q) ||
        (b.remark || "").toLowerCase().includes(q)
      );
    });
  }, [bankingEntries, selectedFY, clients, services, search]);

  // Dynamic totals based on filtered (search) results
  const totals = useMemo(() => ({
    billed: filtered.reduce((s, b) => s + b.amountBilled, 0),
    received: filtered.reduce((s, b) => s + b.amountReceived, 0),
    pending: filtered.reduce((s, b) => s + b.amountPending, 0),
  }), [filtered]);

  const startEdit = (b: typeof filtered[0]) => {
    setEditId(b.id);
    setEditRemark(b.remark || "");
    setEditReceived(String(b.amountReceived || 0));
  };

  const saveEdit = (b: typeof filtered[0]) => {
    const numReceived = parseFloat(editReceived) || 0;
    const newPending = Math.max(0, b.amountBilled - numReceived);
    const newStatus: PaymentStatus = numReceived >= b.amountBilled && b.amountBilled > 0 ? "PAID" : numReceived > 0 ? "PARTIAL" : "PENDING";
    updateBankingEntry({ ...b, amountReceived: numReceived, amountPending: newPending, remark: editRemark, paymentStatus: newStatus });
    setEditId(null);
    toast.success("Entry updated");
  };

  const exportCSV = () => {
    const headers = ["Client", "Package", "Amount Billed", "Amount Received", "Amount Pending", "Payment Status", "Remark"];
    const rows = filtered.map(b => {
      const client = clients.find(c => c.id === b.clientId || (b.clientId && ensureUUID(c.id) === ensureUUID(b.clientId)));
      const service = services.find(s => s.id === b.serviceId || (b.serviceId && ensureUUID(s.id) === ensureUUID(b.serviceId)));
      const pkgName = service?.name || (b.remark?.includes("INVOICE #") ? "Tax Invoice" : "General Billing");
      return [client?.name, pkgName, b.amountBilled, b.amountReceived, b.amountPending, b.paymentStatus || "PENDING", b.remark || ""];
    });
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `banking-${selectedFY}.csv`; a.click();
    toast.success("CSV exported");
  };

  return (
    <AppShell title="Banking & Ledger" subtitle={`FY ${selectedFY} — Billing & collection tracker`}>
      {/* Summary Cards — Dynamic based on search */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
        <div style={{ background: "linear-gradient(135deg, #F0FDF4, #DCFCE7)", border: "1px solid #BBF7D0", borderRadius: 16, padding: 20, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IndianRupee size={22} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>
              {search ? "Filtered " : ""}Total Billed
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#15803D", marginTop: 2 }}>{formatCurrency(totals.billed)}</div>
          </div>
        </div>
        <div style={{ background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)", border: "1px solid #FDE68A", borderRadius: 16, padding: 20, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#D97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle2 size={22} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", textTransform: "uppercase" }}>
              {search ? "Filtered " : ""}Total Received
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#B45309", marginTop: 2 }}>{formatCurrency(totals.received)}</div>
          </div>
        </div>
        <div style={{ background: "linear-gradient(135deg, #FEF2F2, #FEE2E2)", border: "1px solid #FECACA", borderRadius: 16, padding: 20, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertCircle size={22} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#991B1B", textTransform: "uppercase" }}>
              {search ? "Filtered " : ""}Total Pending
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#B91C1C", marginTop: 2 }}>{formatCurrency(totals.pending)}</div>
          </div>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-header">
          <div>
            <div className="data-table-title">Banking Entries — FY {selectedFY}</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>
              {search ? `Showing ${filtered.length} filtered results` : "Click edit to update received amount inline"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div className="search-wrapper">
              <Search className="search-icon" />
              <input
                className="search-input"
                placeholder="Search by client or package..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: 240 }}
              />
            </div>
            <button className="btn-slds btn-slds-secondary" onClick={exportCSV}><Download size={14} /> Export CSV</button>
          </div>
        </div>

        <div className="table-scroll-container">
          <table>
            <thead>
              <tr>
                <th className="col-num">#</th>
                <th>Client</th>
                <th>Package</th>
                <th>Payment Status</th>
                <th className="col-right">Amount Billed</th>
                <th className="col-right">Amount Received</th>
                <th className="col-right">Amount Pending</th>
                <th>Remark</th>
                <th className="col-actions">Edit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => {
                const client = clients.find(c => c.id === b.clientId || (b.clientId && ensureUUID(c.id) === ensureUUID(b.clientId)));
                const service = services.find(s => s.id === b.serviceId || (b.serviceId && ensureUUID(s.id) === ensureUUID(b.serviceId)));
                const isEditing = editId === b.id;
                const numEditReceived = parseFloat(editReceived) || 0;
                const currentReceived = isEditing ? numEditReceived : b.amountReceived;
                const currentPending = isEditing ? Math.max(0, b.amountBilled - numEditReceived) : b.amountPending;
                const currentStatus = (currentReceived >= b.amountBilled && b.amountBilled > 0 ? "PAID" : currentReceived > 0 ? "PARTIAL" : "PENDING") as PaymentStatus;
                const cfg = paymentStatusConfig[currentStatus];
                const StatusIcon = cfg.icon;
                const pkgDisplay = service?.name || (b.remark?.includes("INVOICE #") ? "Tax Invoice / Billing" : b.remark || "-");

                return (
                  <tr key={b.id} style={{ background: isEditing ? "#FFFBEB" : undefined }}>
                    <td className="col-num">{i + 1}</td>
                    <td style={{ fontWeight: 700, color: "#0F172A" }}>{client?.name || "-"}</td>
                    <td style={{ color: "#0176D3", fontWeight: 600 }}>{pkgDisplay}</td>
                    <td>
                      <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 10px",
                        borderRadius: 8,
                        border: `1px solid ${cfg.border}`,
                        background: cfg.bg,
                        color: cfg.color,
                        fontWeight: 700,
                        fontSize: 12,
                      }}>
                        <StatusIcon size={14} />
                        {cfg.label}
                      </div>
                    </td>
                    <td className="col-right" style={{ fontWeight: 600, color: "#059669" }}>{formatCurrency(b.amountBilled)}</td>
                    <td className="col-right">
                      {isEditing
                        ? <input
                            type="number"
                            value={editReceived}
                            onFocus={e => {
                              if (e.target.value === "0") setEditReceived("");
                            }}
                            onChange={e => setEditReceived(e.target.value)}
                            className="form-input"
                            style={{ width: 120, padding: "4px 8px" }}
                            placeholder="0"
                          />
                        : <span style={{ fontWeight: 600, color: "#D97706" }}>{formatCurrency(b.amountReceived)}</span>
                      }
                    </td>
                    <td className="col-right">
                      <span style={{ fontWeight: 700, color: currentPending > 0 ? "#DC2626" : "#059669" }}>
                        {formatCurrency(currentPending)}
                      </span>
                    </td>
                    <td>
                      {isEditing
                        ? <input value={editRemark} onChange={e => setEditRemark(e.target.value)} className="form-input" style={{ padding: "4px 8px" }} placeholder="Add remark..." />
                        : <span style={{ fontSize: 13, color: "#64748B" }}>{b.remark || "-"}</span>
                      }
                    </td>
                    <td className="col-actions">
                      {isEditing
                        ? <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
                            <button className="btn-slds btn-slds-primary" style={{ padding: "4px 8px", background: "#10B981" }} onClick={() => saveEdit(b)}><Check size={13} /></button>
                            <button className="btn-slds btn-slds-secondary" style={{ padding: "4px 8px" }} onClick={() => setEditId(null)}><X size={13} /></button>
                          </div>
                        : <button className="btn-slds btn-slds-secondary" style={{ padding: "5px 8px" }} onClick={() => startEdit(b)} title="Edit inline"><Pencil size={13} /></button>
                      }
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="empty-table-cell">
                    {search ? `No entries found for "${search}"` : `No banking entries for FY ${selectedFY}`}
                  </td>
                </tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ background: "#F8FAFC", fontWeight: 700 }}>
                  <td colSpan={4} style={{ padding: "12px 16px", color: "#374151" }}>
                    TOTAL ({filtered.length} entries){search && " — Filtered Results"}
                  </td>
                  <td className="col-right" style={{ color: "#059669", padding: "12px 16px" }}>{formatCurrency(totals.billed)}</td>
                  <td className="col-right" style={{ color: "#D97706", padding: "12px 16px" }}>{formatCurrency(totals.received)}</td>
                  <td className="col-right" style={{ color: "#DC2626", padding: "12px 16px" }}>{formatCurrency(totals.pending)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </AppShell>
  );
}
