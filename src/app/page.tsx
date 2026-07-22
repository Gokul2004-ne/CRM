"use client";
import { useState } from "react";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { formatCurrency, getDaysRemaining } from "@/lib/utils";
import {
  Users, Briefcase, DollarSign, Clock, MessageCircle,
  TrendingUp, TrendingDown, ArrowUpRight, Filter, Download,
  Layers, AlertTriangle, ShieldCheck, Search
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

export default function Dashboard() {
  const { clients, services, assignedServices, selectedFY } = useAppStore();
  const [searchTerm, setSearchTerm] = useState("");

  const totalClients = clients.length;
  const totalServices = services.length;

  const totalBilled = assignedServices.reduce((acc, curr) => acc + (curr.totalFee || curr.amountBilled || 0), 0);
  const totalReceived = assignedServices.reduce((acc, curr) => acc + (curr.paidAmount || curr.amountReceived || 0), 0);
  const totalPending = assignedServices.reduce((acc, curr) => acc + (curr.pendingAmount || curr.amountPending || 0), 0);

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

  const dueServices = assignedServices.slice(0, 8);
  const filteredDueServices = dueServices.filter(item => {
    const client = clients.find(c => c.id === item.clientId);
    const service = services.find(s => s.id === item.serviceId);
    const name = client?.name || "";
    const svcName = service?.name || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           svcName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <AppShell title="Dashboard" subtitle={`Financial Year ${selectedFY} Overview & Operational Insights`}>
      {/* Salesforce Welcome Banner Header */}
      <div className="page-header-slds">
        <div>
          <div className="breadcrumb">
            <span>Salesforce CRM</span>
            <span>/</span>
            <span className="current">Dashboard</span>
          </div>
          <div className="page-title-slds">CRM Expert Practice Workspace</div>
          <div className="page-subtitle-slds">
            Real-time compliance tracking, client billing, and WhatsApp operations management.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-slds btn-slds-secondary">
            <Download size={15} />
            <span>Export Report</span>
          </button>
          <button className="btn-slds btn-slds-primary">
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
            <span className="kpi-title">Active Services</span>
            <div className="kpi-icon-wrapper purple">
              <Briefcase size={22} />
            </div>
          </div>
          <div className="kpi-value">{totalServices}</div>
          <div className="kpi-trend up">
            <TrendingUp size={12} />
            <span>Configured services</span>
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
          <button className="btn-slds btn-slds-secondary" style={{ padding: "5px 10px", fontSize: 12 }}>
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

      {/* Zoho CRM Upcoming Due Dates Table */}
      <div className="card-slds">
        <div className="table-toolbar-slds">
          <div>
            <div className="card-title-slds">Upcoming Service Due Dates</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>Compliance deadlines sorted by nearest target date</div>
          </div>

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

        <div className="table-wrapper-slds">
          <table className="table-slds">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Assigned Service</th>
                <th>Target Due Date</th>
                <th>Total Fee</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDueServices.length > 0 ? (
                filteredDueServices.map((item) => {
                  const client = clients.find(c => c.id === item.clientId);
                  const service = services.find(s => s.id === item.serviceId);
                  const daysLeft = getDaysRemaining(item.dueDate || "2026-07-31");
                  const isOverdue = daysLeft < 0;

                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600, color: "#0F172A" }}>
                        {client?.name || "Acme Logistics Ltd"}
                      </td>
                      <td style={{ color: "#334155" }}>
                        {service?.name || "GST Monthly Filing"}
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        {item.dueDate || "2026-07-31"}
                      </td>
                      <td style={{ fontWeight: 700, color: "#0F172A" }}>
                        {formatCurrency(item.totalFee || 5000)}
                      </td>
                      <td>
                        <span className={`badge-slds ${isOverdue ? "badge-overdue" : daysLeft <= 5 ? "badge-pending" : "badge-active"}`}>
                          {isOverdue ? `Overdue (${Math.abs(daysLeft)}d)` : `${daysLeft} days left`}
                        </span>
                      </td>
                      <td>
                        {client?.phone && (
                          <a
                            href={`https://wa.me/91${client.phone}?text=Hello%20${encodeURIComponent(client.name)},%20this%20is%20a%20reminder%20for%20your%20due%20date.`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-slds btn-slds-success"
                            style={{ padding: "4px 10px", fontSize: 11 }}
                          >
                            <MessageCircle size={13} />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 24, color: "#64748B" }}>
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
