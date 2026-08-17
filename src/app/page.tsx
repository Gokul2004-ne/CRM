"use client";
import { useState, useMemo } from "react";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { formatCurrency, getDaysRemaining, formatDate, getWhatsAppLink } from "@/lib/utils";
import {
  Users, Package, DollarSign, Clock, MessageCircle, Mail,
  TrendingUp, Download, Filter, Search, AlertTriangle, ShieldCheck, ArrowUpDown, ArrowUp, ArrowDown,
  CheckCircle2, X
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { toast } from "sonner";

import { useRouter } from "next/navigation";
import PaymentAndDeliveryCell from "@/components/PaymentAndDeliveryCell";

export default function Dashboard() {
  const router = useRouter();
  const { clients, services, subServices, assignedServices, invoices, selectedFY } = useAppStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);

  const totalClients = clients.length;
  const totalServices = services.length;

  // Dashboard KPIs: derived from actual invoices (not assignedServices which may lack data)
  const taxInvoices = (invoices || []).filter(inv => inv.type === "INVOICE");
  const totalBilled = taxInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
  const totalReceived = taxInvoices.reduce((acc, inv) => acc + (inv.amountReceived || 0), 0);
  const totalPending = taxInvoices.reduce((acc, inv) => acc + (inv.balanceDue || Math.max(0, (inv.total || 0) - (inv.amountReceived || 0))), 0);

  const collectionEfficiency = totalBilled > 0 ? ((totalReceived / totalBilled) * 100).toFixed(1) : "0.0";
  const avgMonthlyBilled = totalBilled / 12;
  const avgMonthlyReceived = totalReceived / 12;

  // Chart data: group invoices by the actual month they were created in
  const fyStart = parseInt(selectedFY?.split("-")[0] || "2024");
  const monthShortNames = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  // Month order in FY: Apr(3), May(4), ..., Dec(11), Jan(0), Feb(1), Mar(2)
  const fyMonthOrder = [3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2];

  const chartData = monthShortNames.map((month, idx) => {
    const calMonth = fyMonthOrder[idx]; // 0-based JS month
    const calYear = calMonth >= 3 ? fyStart : fyStart + 1;
    const monthInvoices = taxInvoices.filter(inv => {
      if (!inv.date && !inv.createdAt) return false;
      const d = new Date(inv.date || inv.createdAt || "");
      return d.getMonth() === calMonth && d.getFullYear() === calYear;
    });
    const Billed = monthInvoices.reduce((s, inv) => s + (inv.total || 0), 0);
    const Received = monthInvoices.reduce((s, inv) => s + (inv.amountReceived || 0), 0);
    const Pending = monthInvoices.reduce((s, inv) => s + (inv.balanceDue || Math.max(0, (inv.total || 0) - (inv.amountReceived || 0))), 0);
    return { month, Billed, Received, Pending };
  });

  // Export Executive Practice & Billing Report as formatted CSV with UTF-8 BOM
  const exportExecutiveReportCSV = () => {
    const BOM = "\ufeff";
    const lines: string[] = [];

    lines.push("--- ZPLUSCRM EXECUTIVE PRACTICE SUMMARY ---");
    lines.push(`Financial Year,${selectedFY}`);
    lines.push(`Total Active Clients,${totalClients}`);
    lines.push(`Configured Service Packages,${totalServices}`);
    lines.push(`Total Amount Billed,${totalBilled}`);
    lines.push(`Total Amount Received,${totalReceived}`);
    lines.push(`Total Amount Pending,${totalPending}`);
    lines.push(`Collection Efficiency Rate,${collectionEfficiency}%`);
    lines.push(`Report Generation Date,${new Date().toLocaleDateString("en-IN")}`);
    lines.push("");

    lines.push("--- MONTHLY BILLING & COLLECTIONS BREAKDOWN (FY " + selectedFY + ") ---");
    lines.push("Month,Amount Billed (INR),Amount Received (INR),Amount Pending (INR)");
    chartData.forEach(c => {
      lines.push(`"${c.month}",${c.Billed},${c.Received},${c.Pending}`);
    });
    lines.push("");

    lines.push("--- UPCOMING COMPLIANCE DUE DATES & PAYMENT STATUS ---");
    lines.push("Client Name,Package / Service,Due Date,Days Remaining,Payment Status");
    sortedDueServices.forEach(item => {
      const cName = item.client?.name || "Client";
      const sName = item.service?.name || "Service";
      const dDate = item.dueDate ? formatDate(item.dueDate) : "-";
      const daysStr = item.daysLeft < 0 ? `${Math.abs(item.daysLeft)} days overdue` : `${item.daysLeft} days left`;
      const pStatus = item.status || "PENDING";
      lines.push(`"${cName.replace(/"/g, '""')}","${sName.replace(/"/g, '""')}","${dDate}","${daysStr}","${pStatus}"`);
    });

    const csvContent = BOM + lines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zpluscrm-executive-report-FY${selectedFY}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`🎉 Executive Practice Report for FY ${selectedFY} downloaded!`);
  };

  // Section 8: Dynamic sorting & Proximity color coding
  // Sort items closer to (or past) the due date to the top (Ascending default), with toggle support
  const sortedDueServices = useMemo(() => {
    return assignedServices
      .filter(item => item.dueDate)
      .map(item => {
        const client = clients.find(c => c.id === item.clientId);
        const service = services.find(s => s.id === item.serviceId);
        const daysLeft = getDaysRemaining(item.dueDate!);
        return { ...item, client, service, daysLeft };
      })
      .filter(item => {
        const name = item.client?.name || "";
        const svcName = item.service?.name || "";
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               svcName.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => {
        const timeA = new Date(a.dueDate!).getTime();
        const timeB = new Date(b.dueDate!).getTime();
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      });
  }, [assignedServices, clients, services, searchTerm, sortOrder]);

  return (
    <AppShell title="Dashboard" subtitle={`Financial Year ${selectedFY} Overview & Compliance Priority Grid`}>
      {/* zpluscrm Welcome Banner Header */}
      <div className="page-header-slds">
        <div>
          <div className="breadcrumb">
            <span>zpluscrm</span>
            <span>/</span>
            <span className="current">Dashboard</span>
          </div>
          <div className="page-title-slds">zpluscrm Practice Workspace</div>
          <div className="page-subtitle-slds">
            Real-time compliance tracking, client billing, and WhatsApp operations management.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="btn-slds btn-slds-secondary" onClick={exportExecutiveReportCSV}>
            <Download size={15} />
            <span>Export Report</span>
          </button>
          <button type="button" className="btn-slds btn-slds-primary" onClick={() => setIsInsightsOpen(true)}>
            <TrendingUp size={15} />
            <span>Billing Insights</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stat-grid-slds">
        <div
          className="kpi-card-slds"
          style={{ cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
          onClick={() => router.push("/clients")}
          title="Click to view Client Directory"
        >
          <div className="kpi-header">
            <span className="kpi-title">Total Active Clients</span>
            <div className="kpi-icon-wrapper blue">
              <Users size={22} />
            </div>
          </div>
          <div className="kpi-value">{totalClients}</div>
          <div className="kpi-trend up">
            <TrendingUp size={12} />
            <span>Active records</span>
          </div>
        </div>

        <div
          className="kpi-card-slds"
          style={{ cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
          onClick={() => router.push("/services")}
          title="Click to view Packages & Services"
        >
          <div className="kpi-header">
            <span className="kpi-title">Active Package Services</span>
            <div className="kpi-icon-wrapper purple">
              <Package size={22} />
            </div>
          </div>
          <div className="kpi-value">{totalServices}</div>
          <div className="kpi-trend up">
            <TrendingUp size={12} />
            <span>Configured packages</span>
          </div>
        </div>

        <div
          className="kpi-card-slds"
          style={{ cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
          onClick={() => router.push("/banking")}
          title="Click to view Financial Ledger & Banking"
        >
          <div className="kpi-header">
            <span className="kpi-title">Total Amount Billed</span>
            <div className="kpi-icon-wrapper emerald">
              <DollarSign size={22} />
            </div>
          </div>
          <div className="kpi-value">{formatCurrency(totalBilled)}</div>
          <div className="kpi-trend up">
            <TrendingUp size={12} />
            <span>FY total</span>
          </div>
        </div>

        <div
          className="kpi-card-slds"
          style={{ cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
          onClick={() => router.push("/banking")}
          title="Click to view Collections Ledger"
        >
          <div className="kpi-header">
            <span className="kpi-title">Amount Received</span>
            <div className="kpi-icon-wrapper amber">
              <ShieldCheck size={22} />
            </div>
          </div>
          <div className="kpi-value">{formatCurrency(totalReceived)}</div>
          <div className="kpi-trend up">
            <TrendingUp size={12} />
            <span>Collections</span>
          </div>
        </div>

        <div
          className="kpi-card-slds"
          style={{ cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
          onClick={() => router.push("/banking")}
          title="Click to view Pending Outstanding Accounts"
        >
          <div className="kpi-header">
            <span className="kpi-title">Pending Balance</span>
            <div className="kpi-icon-wrapper rose">
              <Clock size={22} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: totalPending > 0 ? "#DC2626" : "#0F172A" }}>
            {formatCurrency(totalPending)}
          </div>
          <div className="kpi-trend down">
            <AlertTriangle size={12} />
            <span>Pending dues</span>
          </div>
        </div>
      </div>

      {/* Monthly Analytics Chart */}
      <div className="card-slds">
        <div className="card-header-slds">
          <div>
            <div className="card-title-slds">Monthly Billing & Collections Overview</div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
              April {selectedFY.split("-")[0]} – March 20{selectedFY.split("-")[1]} performance chart
            </div>
          </div>
          <button type="button" className="btn-slds btn-slds-secondary" style={{ padding: "5px 10px", fontSize: 12 }}>
            <Filter size={13} />
            <span>FY Breakdown</span>
          </button>
        </div>
        <div style={{ padding: 24 }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => formatCurrency(Number(v ?? 0))} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Bar dataKey="Billed" fill="#0176D3" radius={[6,6,0,0]} />
              <Bar dataKey="Received" fill="#00A88F" radius={[6,6,0,0]} />
              <Bar dataKey="Pending" fill="#EF4444" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Section 8: Upcoming Service Due Dates with Proximity Color Coding & Sort Toggle */}
      <div className="card-slds">
        <div className="table-toolbar-slds" style={{ flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="card-title-slds" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span>Upcoming Compliance Due Dates</span>
              <span style={{ fontSize: 11, background: "#EFF6FF", color: "#1D4ED8", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                Dynamic Priority
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#64748B" }}>
              🟢 Green (&gt;15 days) • 🟡 Yellow (10–15 days) • 🔴 Red (≤9 days / Overdue)
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Sort Toggle Button (Ascending / Descending per Section 8) */}
            <button
              type="button"
              className="btn-slds btn-slds-secondary"
              style={{ padding: "6px 12px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}
              onClick={(e) => {
                e.preventDefault();
                setSortOrder(sortOrder === "asc" ? "desc" : "asc");
              }}
              title="Toggle Ascending/Descending Sort"
            >
              <ArrowUpDown size={14} />
              <span>Sort: {sortOrder === "asc" ? "Nearest First (Asc)" : "Furthest First (Desc)"}</span>
              {sortOrder === "asc" ? <ArrowUp size={12} color="#059669" /> : <ArrowDown size={12} color="#DC2626" />}
            </button>

            <div className="search-input-wrapper">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search due dates by client or service..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="table-wrapper-slds">
          <table className="table-slds">
            <thead>
              <tr>
                <th style={{ width: 60, textAlign: "center" }}>S.No.</th>
                <th>Client Name</th>
                <th>Sub Service Name</th>
                <th>Due Date</th>
                <th>Payment & Service Status</th>
                <th>Proximity Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedDueServices.length > 0 ? (
                sortedDueServices.map((item, index) => {
                  const daysLeft = item.daysLeft;
                  const isOverdue = daysLeft < 0;
                  const phoneNum = item.client?.phone || item.client?.mobile || "";
                  const assignedSubs = subServices.filter(ss => item.subServiceIds?.includes(ss.id));

                  let badgeStyle = { background: "#DCFCE7", color: "#166534", border: "1px solid #86EFAC" }; // Green
                  let badgeText = `🟢 Green • ${daysLeft}d remaining`;

                  if (isOverdue) {
                    badgeStyle = { background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5" }; // Red Overdue
                    badgeText = `🔴 Red • Overdue (${Math.abs(daysLeft)}d ago)`;
                  } else if (daysLeft <= 9) {
                    badgeStyle = { background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5" }; // Red Critical
                    badgeText = `🔴 Red • ${daysLeft}d (Critical)`;
                  } else if (daysLeft <= 15) {
                    badgeStyle = { background: "#FEF3C7", color: "#92400E", border: "1px solid #FCD34D" }; // Yellow Approaching
                    badgeText = `🟡 Yellow • ${daysLeft}d (Approaching)`;
                  }

                  return (
                    <tr key={item.id} style={{ background: isOverdue ? "#FFF5F5" : daysLeft <= 9 ? "#FFFAF0" : "transparent" }}>
                      <td style={{ fontWeight: 700, color: "#64748B", textAlign: "center", fontSize: 13 }}>
                        {index + 1}
                      </td>
                      <td style={{ fontWeight: 700, color: "#0F172A" }}>
                        {item.client?.name || "Unknown Client"}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: "#0176D3", fontSize: 13 }}>{item.service?.name || "Package"}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                          {assignedSubs.map(ss => (
                            <span key={ss.id} className="chip" style={{ background: "#EFF6FF", color: "#1D4ED8", fontSize: 11, fontWeight: 600 }}>
                              {ss.name}
                            </span>
                          ))}
                          {assignedSubs.length === 0 && <span style={{ fontSize: 11, color: "#94A3B8" }}>—</span>}
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: isOverdue ? "#DC2626" : daysLeft <= 9 ? "#DC2626" : "#0F172A", fontSize: 13 }}>
                        {formatDate(item.dueDate!)}
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {/* Payment Status */}
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px",
                            borderRadius: 6, fontSize: 11, fontWeight: 700,
                            background: (item.amountReceived || 0) >= (item.amountBilled || 1) && (item.amountBilled || 0) > 0 ? "#F0FDF4" :
                                        (item.amountReceived || 0) > 0 ? "#FFFBEB" : "#FEF2F2",
                            color: (item.amountReceived || 0) >= (item.amountBilled || 1) && (item.amountBilled || 0) > 0 ? "#059669" :
                                   (item.amountReceived || 0) > 0 ? "#D97706" : "#DC2626"
                          }}>
                            {(item.amountReceived || 0) >= (item.amountBilled || 1) && (item.amountBilled || 0) > 0 ? "✓ Paid" :
                             (item.amountReceived || 0) > 0 ? "~ Partial" : "✗ Pending"}
                          </span>
                          {/* Delivery Status */}
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px",
                            borderRadius: 6, fontSize: 11, fontWeight: 700,
                            background: item.status === "COMPLETED" ? "#F0FDF4" : item.status === "IN_PROGRESS" ? "#FFFBEB" : "#F1F5F9",
                            color: item.status === "COMPLETED" ? "#059669" : item.status === "IN_PROGRESS" ? "#D97706" : "#64748B"
                          }}>
                            {item.status === "COMPLETED" ? "✓ Delivered" : item.status === "IN_PROGRESS" ? "⟳ In Progress" : "○ Not Started"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="badge-slds" style={{ ...badgeStyle, padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                          {badgeText}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          {phoneNum && (
                            <a
                              href={getWhatsAppLink(phoneNum, `Hello ${item.client?.name}, this is a reminder regarding ${item.service?.name} due on ${formatDate(item.dueDate!)}.`)}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-slds btn-slds-success"
                              style={{ padding: "4px 8px", fontSize: 11 }}
                              title="WhatsApp"
                            >
                              <MessageCircle size={13} />
                            </a>
                          )}
                          {item.client?.email && (
                            <a
                              href={`mailto:${item.client.email}?subject=${encodeURIComponent(`Reminder: ${item.service?.name}`)}&body=${encodeURIComponent(`Dear ${item.client?.name},\n\nThis is a reminder for ${item.service?.name} due on ${formatDate(item.dueDate!)}.\n\nThank you!`)}`}
                              className="btn-slds btn-slds-secondary"
                              style={{ padding: "4px 8px", fontSize: 11, color: "#0284C7" }}
                              title="Email"
                            >
                              <Mail size={13} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 24, color: "#64748B" }}>
                    No matching due dates found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Billing Insights Modal */}
      {isInsightsOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20
        }}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: 20,
            maxWidth: 580,
            width: "100%",
            padding: 28,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid #E2E8F0"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "#EFF6FF", color: "#0284C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <TrendingUp size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: 0 }}>Billing & Financial Insights</h3>
                  <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Performance breakdown for FY {selectedFY}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInsightsOpen(false)}
                style={{ background: "#F1F5F9", border: "none", borderRadius: 10, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748B" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Collection Progress Bar */}
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 16, padding: 18, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, fontWeight: 700 }}>
                <span style={{ color: "#475569" }}>Collection Efficiency Rate</span>
                <span style={{ color: Number(collectionEfficiency) >= 75 ? "#059669" : Number(collectionEfficiency) >= 50 ? "#D97706" : "#DC2626" }}>
                  {collectionEfficiency}% ({formatCurrency(totalReceived)} / {formatCurrency(totalBilled)})
                </span>
              </div>
              <div style={{ width: "100%", height: 10, borderRadius: 5, background: "#E2E8F0", overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, Math.max(0, parseFloat(collectionEfficiency)))}%`, height: "100%", background: Number(collectionEfficiency) >= 75 ? "#059669" : Number(collectionEfficiency) >= 50 ? "#D97706" : "#DC2626", transition: "width 0.4s ease" }} />
              </div>
            </div>

            {/* Detailed Insights Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 22 }}>
              <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>Monthly Avg Billed</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#15803D", marginTop: 4 }}>{formatCurrency(avgMonthlyBilled)}</div>
              </div>

              <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", textTransform: "uppercase" }}>Monthly Avg Collection</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#B45309", marginTop: 4 }}>{formatCurrency(avgMonthlyReceived)}</div>
              </div>

              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#991B1B", textTransform: "uppercase" }}>Total Outstanding Dues</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#B91C1C", marginTop: 4 }}>{formatCurrency(totalPending)}</div>
              </div>

              <div style={{ background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#075985", textTransform: "uppercase" }}>Tax Invoices Created</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#0284C7", marginTop: 4 }}>{taxInvoices.length} Invoices</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => { setIsInsightsOpen(false); window.location.href = "/banking"; }}
                className="btn-slds btn-slds-secondary"
                style={{ padding: "10px 16px" }}
              >
                <span>View Banking Ledger →</span>
              </button>
              <button
                type="button"
                onClick={() => { setIsInsightsOpen(false); window.location.href = "/invoice"; }}
                className="btn-slds btn-slds-primary"
                style={{ padding: "10px 16px" }}
              >
                <span>Create Tax Invoice →</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

