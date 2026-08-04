"use client";
import { useState, useMemo } from "react";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { formatCurrency, getDaysRemaining, formatDate, getWhatsAppLink } from "@/lib/utils";
import {
  Users, Package, DollarSign, Clock, MessageCircle, Mail,
  TrendingUp, Download, Filter, Search, AlertTriangle, ShieldCheck, ArrowUpDown, ArrowUp, ArrowDown,
  CheckCircle2
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

import PaymentAndDeliveryCell from "@/components/PaymentAndDeliveryCell";

export default function Dashboard() {
  const { clients, services, subServices, assignedServices, selectedFY } = useAppStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const totalClients = clients.length;
  const totalServices = services.length;

  const totalBilled = assignedServices.reduce((acc, curr) => acc + ((curr as any).totalFee || curr.amountBilled || 0), 0);
  const totalReceived = assignedServices.reduce((acc, curr) => acc + ((curr as any).paidAmount || curr.amountReceived || 0), 0);
  const totalPending = assignedServices.reduce((acc, curr) => acc + ((curr as any).pendingAmount || curr.amountPending || 0), 0);

  // Chart data for April - March
  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  const chartData = months.map((month) => {
    return {
      month,
      Billed: Math.round(totalBilled > 0 ? (totalBilled / 12) : 0),
      Received: Math.round(totalReceived > 0 ? (totalReceived / 12) : 0),
      Pending: Math.round(totalPending > 0 ? (totalPending / 12) : 0),
    };
  });

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
          <button type="button" className="btn-slds btn-slds-secondary">
            <Download size={15} />
            <span>Export Report</span>
          </button>
          <button type="button" className="btn-slds btn-slds-primary">
            <TrendingUp size={15} />
            <span>Billing Insights</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stat-grid-slds">
        <div className="kpi-card-slds">
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

        <div className="kpi-card-slds">
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

        <div className="kpi-card-slds">
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

        <div className="kpi-card-slds">
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

        <div className="kpi-card-slds">
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
    </AppShell>
  );
}

