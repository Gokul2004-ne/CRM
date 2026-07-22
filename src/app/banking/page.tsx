"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { Pencil, Check, X, Download } from "lucide-react";
import { toast } from "sonner";

export default function BankingPage() {
  const { bankingEntries, clients, services, subServices, selectedFY, updateBankingEntry } = useAppStore();
  const [editId, setEditId] = useState<string | null>(null);
  const [editRemark, setEditRemark] = useState("");
  const [editReceived, setEditReceived] = useState(0);

  const filtered = useMemo(() =>
    bankingEntries.filter(b => b.financialYear === selectedFY), [bankingEntries, selectedFY]);

  const totals = useMemo(() => ({
    billed: filtered.reduce((s, b) => s + b.amountBilled, 0),
    received: filtered.reduce((s, b) => s + b.amountReceived, 0),
    pending: filtered.reduce((s, b) => s + b.amountPending, 0),
  }), [filtered]);

  const startEdit = (b: typeof filtered[0]) => {
    setEditId(b.id);
    setEditRemark(b.remark || "");
    setEditReceived(b.amountReceived);
  };

  const saveEdit = (b: typeof filtered[0]) => {
    const newPending = b.amountBilled - editReceived;
    updateBankingEntry({ ...b, amountReceived: editReceived, amountPending: newPending, remark: editRemark });
    setEditId(null);
    toast.success("Entry updated");
  };

  const exportCSV = () => {
    const headers = ["Client", "Service", "Sub Service", "Billed", "Received", "Pending", "Remark"];
    const rows = filtered.map(b => {
      const client = clients.find(c => c.id === b.clientId);
      const service = services.find(s => s.id === b.serviceId);
      const ss = subServices.find(s => s.id === b.subServiceId);
      return [client?.name, service?.name, ss?.name || "-", b.amountBilled, b.amountReceived, b.amountPending, b.remark || ""];
    });
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `banking-${selectedFY}.csv`; a.click();
    toast.success("CSV exported");
  };

  return (
    <AppShell title="Banking" subtitle={`FY ${selectedFY} — Billing & collection tracker`}>
      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>Total Billed</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#15803D", marginTop: 4 }}>{formatCurrency(totals.billed)}</div>
        </div>
        <div style={{ background: "#FEFCE8", border: "1px solid #FEF08A", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#854D0E", textTransform: "uppercase" }}>Total Received</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#A16207", marginTop: 4 }}>{formatCurrency(totals.received)}</div>
        </div>
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#991B1B", textTransform: "uppercase" }}>Total Pending</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#B91C1C", marginTop: 4 }}>{formatCurrency(totals.pending)}</div>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-header">
          <div>
            <div className="data-table-title">Banking Entries — FY {selectedFY}</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>Click the edit icon to update received amount and remarks inline</div>
          </div>
          <button className="btn-slds btn-slds-secondary" onClick={exportCSV}><Download size={14} /> Export CSV</button>
        </div>

        <div className="table-scroll-container">
          <table>
            <thead>
              <tr>
                <th className="col-num">#</th>
                <th>Client</th>
                <th>Service</th>
                <th>Sub Service</th>
                <th className="col-right">Amount Billed</th>
                <th className="col-right">Amount Received</th>
                <th className="col-right">Amount Pending</th>
                <th>Remark</th>
                <th className="col-actions">Edit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => {
                const client = clients.find(c => c.id === b.clientId);
                const service = services.find(s => s.id === b.serviceId);
                const ss = subServices.find(s => s.id === b.subServiceId);
                const isEditing = editId === b.id;
                return (
                  <tr key={b.id} style={{ background: isEditing ? "#FFFBEB" : undefined }}>
                    <td className="col-num">{i + 1}</td>
                    <td style={{ fontWeight: 700, color: "#0F172A" }}>{client?.name || "-"}</td>
                    <td>{service?.name || "-"}</td>
                    <td>{ss ? <span className="chip">{ss.name}</span> : "-"}</td>
                    <td className="col-right" style={{ fontWeight: 600, color: "#059669" }}>{formatCurrency(b.amountBilled)}</td>
                    <td className="col-right">
                      {isEditing
                        ? <input type="number" value={editReceived} onChange={e => setEditReceived(Number(e.target.value))} className="form-input" style={{ width: 120, padding: "4px 8px" }} />
                        : <span style={{ fontWeight: 600, color: "#D97706" }}>{formatCurrency(b.amountReceived)}</span>
                      }
                    </td>
                    <td className="col-right">
                      <span style={{ fontWeight: 700, color: (isEditing ? b.amountBilled - editReceived : b.amountPending) > 0 ? "#DC2626" : "#059669" }}>
                        {formatCurrency(isEditing ? b.amountBilled - editReceived : b.amountPending)}
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
                    No banking entries for FY {selectedFY}
                  </td>
                </tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ background: "#F8FAFC", fontWeight: 700 }}>
                  <td colSpan={4} style={{ padding: "12px 16px", color: "#374151" }}>TOTAL ({filtered.length} entries)</td>
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
