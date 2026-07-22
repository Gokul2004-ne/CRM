"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useMemo } from "react";
import { getDaysUntilDue, formatDate, getWhatsAppLink, getDueBadgeColor, getFYMonths } from "@/lib/utils";
import { format, isSameMonth } from "date-fns";
import { MessageCircle } from "lucide-react";

export default function DueDatesPage() {
  const { assignedServices, clients, services, selectedFY } = useAppStore();

  const months = getFYMonths(selectedFY);

  const fyServices = useMemo(() =>
    assignedServices.filter(a => a.financialYear === selectedFY && a.dueDate),
    [assignedServices, selectedFY]);

  const getServicesForMonth = (month: Date) =>
    fyServices.filter(a => isSameMonth(new Date(a.dueDate!), month));

  return (
    <AppShell title="Due Date Calendar" subtitle={`Full year view — FY ${selectedFY} (April to March)`}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {months.map(month => {
          const monthServices = getServicesForMonth(month);
          return (
            <div key={month.toISOString()} className="section-card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{
                background: "linear-gradient(135deg, #1A237E, #283593)",
                padding: "12px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{format(month, "MMMM yyyy")}</span>
                <span style={{ background: "rgba(255,255,255,0.2)", color: "white", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                  {monthServices.length} due
                </span>
              </div>
              {monthServices.length === 0 ? (
                <div style={{ padding: "20px 16px", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
                  No due dates this month
                </div>
              ) : (
                <div style={{ padding: "10px 0" }}>
                  {monthServices.map(a => {
                    const client = clients.find(c => c.id === a.clientId);
                    const service = services.find(s => s.id === a.serviceId);
                    const days = getDaysUntilDue(a.dueDate!);
                    return (
                      <div key={a.id} style={{
                        padding: "10px 14px",
                        borderBottom: "1px solid #F1F5F9",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>{service?.name}</span>
                          <span className={`badge ${getDueBadgeColor(days)}`} style={{ fontSize: 10 }}>
                            {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "#64748B" }}>{client?.name}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                          <span style={{ fontSize: 11, color: "#94A3B8" }}>Due: {formatDate(a.dueDate!)}</span>
                          {client?.mobile && (
                            <a href={getWhatsAppLink(client.mobile, `Reminder: ${service?.name} is due on ${formatDate(a.dueDate!)}`)}
                              target="_blank" rel="noreferrer" className="wa-btn" style={{ fontSize: 11, padding: "3px 8px" }}>
                              <MessageCircle size={11} /> WA
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
