"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useMemo } from "react";
import { formatCurrency, formatDate, getDaysUntilDue, getDueBadgeColor, getWhatsAppLink } from "@/lib/utils";
import { Users, Briefcase, TrendingUp, TrendingDown, Clock, MessageCircle, Phone } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function DashboardPage() {
  const { clients, services, assignedServices, selectedFY } = useAppStore();

  const stats = useMemo(() => {
    const fyServices = assignedServices.filter(a => a.financialYear === selectedFY);
    return {
      totalClients: clients.length,
      totalServices: services.length,
      totalBilled: fyServices.reduce((s, a) => s + a.amountBilled, 0),
      totalReceived: fyServices.reduce((s, a) => s + a.amountReceived, 0),
      totalPending: fyServices.reduce((s, a) => s + a.amountPending, 0),
    };
  }, [clients, services, assignedServices, selectedFY]);

  const chartData = useMemo(() => {
    const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    return months.map((month, i) => ({
      month,
      Billed: Math.floor(Math.random() * 40000 + 10000),
      Received: Math.floor(Math.random() * 30000 + 8000),
      Pending: Math.floor(Math.random() * 15000 + 2000),
    }));
  }, [selectedFY]);

  const dueDateRows = useMemo(() => {
    return assignedServices
      .filter(a => a.financialYear === selectedFY && a.dueDate)
      .map(a => {
        const client = clients.find(c => c.id === a.clientId);
        const service = useAppStore.getState().services.find(s => s.id === a.serviceId);
        return {
          id: a.id,
          serviceName: service?.name || "-",
          dueDate: a.dueDate!,
          clientName: client?.name || "-",
          clientMobile: client?.mobile || "",
          daysPending: getDaysUntilDue(a.dueDate!),
        };
      })
      .sort((a, b) => a.daysPending - b.daysPending)
      .slice(0, 10);
  }, [assignedServices, clients, selectedFY]);

  return (
    <AppShell title="Dashboard" subtitle={`Financial Year ${selectedFY}`}>
      {/* Stat Cards Row */}
      <div className="grid-5" style={{ marginBottom: 20 }}>
        <div className="stat-card blue">
          <div className="stat-label">Total Clients</div>
          <div className="stat-value">{stats.totalClients}</div>
          <Users className="stat-icon" size={56} />
        </div>
        <div className="stat-card orange">
          <div className="stat-label">Total Services</div>
          <div className="stat-value">{stats.totalServices}</div>
          <Briefcase className="stat-icon" size={56} />
        </div>
        <div className="fin-card green">
          <div className="fin-label">Amount Billed</div>
          <div className="fin-value">{formatCurrency(stats.totalBilled)}</div>
          <TrendingUp size={18} style={{ opacity: 0.8, marginTop: 4 }} />
        </div>
        <div className="fin-card yellow">
          <div className="fin-label">Amount Received</div>
          <div className="fin-value">{formatCurrency(stats.totalReceived)}</div>
          <TrendingUp size={18} style={{ opacity: 0.8, marginTop: 4 }} />
        </div>
        <div className="fin-card red">
          <div className="fin-label">Amount Pending</div>
          <div className="fin-value">{formatCurrency(stats.totalPending)}</div>
          <TrendingDown size={18} style={{ opacity: 0.8, marginTop: 4 }} />
        </div>
      </div>

      {/* Chart */}
      <div className="section-card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Monthly Billing Overview</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>April {selectedFY.split("-")[0]} – March 20{selectedFY.split("-")[1]}</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Billed" fill="#059669" radius={[4,4,0,0]} />
            <Bar dataKey="Received" fill="#D97706" radius={[4,4,0,0]} />
            <Bar dataKey="Pending" fill="#DC2626" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Due Date Table */}
      <div className="data-table-wrapper">
        <div className="data-table-header">
          <div>
            <div className="data-table-title">Upcoming Due Dates</div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Services sorted by nearest due date</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={14} color="#94A3B8" />
            <span style={{ fontSize: 12, color: "#94A3B8" }}>{dueDateRows.length} entries</span>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Service Name</th>
              <th>Due Date</th>
              <th>Client Name</th>
              <th>Days Pending</th>
              <th>Client Number</th>
              <th>WhatsApp</th>
            </tr>
          </thead>
          <tbody>
            {dueDateRows.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>No upcoming due dates</td></tr>
            ) : dueDateRows.map(row => (
              <tr key={row.id}>
                <td style={{ fontWeight: 600, color: "#1A237E" }}>{row.serviceName}</td>
                <td>{formatDate(row.dueDate)}</td>
                <td>{row.clientName}</td>
                <td>
                  <span className={`badge ${getDueBadgeColor(row.daysPending)}`}>
                    {row.daysPending < 0 ? `${Math.abs(row.daysPending)}d overdue` : `${row.daysPending}d`}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Phone size={12} color="#94A3B8" />
                    {row.clientMobile}
                  </div>
                </td>
                <td>
                  <a href={getWhatsAppLink(row.clientMobile, `Hi, this is a reminder for ${row.serviceName} due on ${formatDate(row.dueDate)}`)} target="_blank" rel="noreferrer" className="wa-btn">
                    <MessageCircle size={13} /> WhatsApp
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
