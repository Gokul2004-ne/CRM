"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
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
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="fin-card green"><div className="fin-label">Total Billed</div><div className="fin-value">{formatCurrency(totals.billed)}</div></div>
        <div className="fin-card yellow"><div className="fin-label">Total Received</div><div className="fin-value">{formatCurrency(totals.received)}</div></div>
        <div className="fin-card red"><div className="fin-label">Total Pending</div><div className="fin-value">{formatCurrency(totals.pending)}</div></div>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-header">
          <div>
            <div className="data-table-title">Banking Entries — FY {selectedFY}</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>Click the edit icon to update received amount and remarks inline</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}><Download size={14} /> Export CSV</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th><th>Client</th><th>Service</th><th>Sub Service</th>
              <th>Amount Billed</th><th>Amount Received</th><th>Amount Pending</th><th>Remark</th><th>Edit</th>
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
                  <td style={{ color: "#94A3B8", fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ fontWeight: 700 }}>{client?.name || "-"}</td>
                  <td>{service?.name || "-"}</td>
                  <td>{ss ? <span className="chip">{ss.name}</span> : "-"}</td>
                  <td style={{ fontWeight: 600, color: "#059669" }}>{formatCurrency(b.amountBilled)}</td>
                  <td>
                    {isEditing
                      ? <input type="number" value={editReceived} onChange={e => setEditReceived(Number(e.target.value))} className="form-input" style={{ width: 120, padding: "4px 8px" }} />
                      : <span style={{ fontWeight: 600, color: "#D97706" }}>{formatCurrency(b.amountReceived)}</span>
                    }
                  </td>
                  <td>
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
                  <td>
                    {isEditing
                      ? <div style={{ display: "flex", gap: 4 }}>
                          <button className="btn btn-success btn-icon btn-sm" onClick={() => saveEdit(b)}><Check size={13} /></button>
                          <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setEditId(null)}><X size={13} /></button>
                        </div>
                      : <button className="btn btn-ghost btn-icon btn-sm" onClick={() => startEdit(b)}><Pencil size={13} /></button>
                    }
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>No banking entries for FY {selectedFY}</td></tr>
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr style={{ background: "#F8FAFC", fontWeight: 700 }}>
                <td colSpan={4} style={{ padding: "12px 14px", color: "#374151" }}>TOTAL ({filtered.length} entries)</td>
                <td style={{ color: "#059669", padding: "12px 14px" }}>{formatCurrency(totals.billed)}</td>
                <td style={{ color: "#D97706", padding: "12px 14px" }}>{formatCurrency(totals.received)}</td>
                <td style={{ color: "#DC2626", padding: "12px 14px" }}>{formatCurrency(totals.pending)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </AppShell>
  );
}
