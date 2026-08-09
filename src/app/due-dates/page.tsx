"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { getDaysUntilDue, formatDate, getWhatsAppLink, formatCurrency } from "@/lib/utils";
import { MessageCircle, Mail, Calendar, CheckCircle2, Clock, AlertCircle, Search } from "lucide-react";
import { toast } from "sonner";

const MONTHS = [
  "April", "May", "June", "July", "August", "September",
  "October", "November", "December", "January", "February", "March"
];

export default function DueDatesPage() {
  const { services, subServices, selectedFY } = useAppStore();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const fyStartYear = parseInt(selectedFY?.split("-")[0] || "2024");

  const monthYearMap: Record<string, { month: number; year: number }> = {
    "April": { month: 3, year: fyStartYear },
    "May": { month: 4, year: fyStartYear },
    "June": { month: 5, year: fyStartYear },
    "July": { month: 6, year: fyStartYear },
    "August": { month: 7, year: fyStartYear },
    "September": { month: 8, year: fyStartYear },
    "October": { month: 9, year: fyStartYear },
    "November": { month: 10, year: fyStartYear },
    "December": { month: 11, year: fyStartYear },
    "January": { month: 0, year: fyStartYear + 1 },
    "February": { month: 1, year: fyStartYear + 1 },
    "March": { month: 2, year: fyStartYear + 1 },
  };

  const dueItems = useMemo(() => {
    // Compliance Calendar: show Services (Packages) that have a dueDate configured
    return services
      .filter(s => s.dueDate || s.dueDateDay)
      .map(s => {
        // Build a concrete due date for current FY: use s.dueDate directly or compute from dueDateDay + April of FY
        let dueDateStr = s.dueDate || "";
        if (!dueDateStr && s.dueDateDay) {
          // Default: April of the FY start year on that day
          const pad = (n: number) => String(n).padStart(2, "0");
          dueDateStr = `${fyStartYear}-04-${pad(s.dueDateDay)}`;
        }
        const dueDate = new Date(dueDateStr);
        const monthIndex = dueDate.getMonth();
        const monthName = ["January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"][monthIndex];
        const daysLeft = getDaysUntilDue(dueDateStr);
        // Sub-services (services under this package)
        const subs = subServices.filter(ss => ss.serviceId === s.id);
        return { ...s, dueDate, monthName, daysLeft, subs, dueDateStr };
      })
      .filter(item =>
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.subs.some((ss: any) => ss.name.toLowerCase().includes(search.toLowerCase()))
      );
  }, [services, subServices, fyStartYear, search]);

  // Group items by FY month
  const itemsByMonth = useMemo(() => {
    const map: Record<string, typeof dueItems> = {};
    MONTHS.forEach(m => { map[m] = []; });
    dueItems.forEach(item => {
      if (map[item.monthName] !== undefined) {
        map[item.monthName].push(item);
      }
    });
    return map;
  }, [dueItems]);

  const getStatusIcon = (daysLeft: number) => {
    if (daysLeft < 0) return <AlertCircle size={14} color="#DC2626" />;
    if (daysLeft <= 9) return <AlertCircle size={14} color="#DC2626" />;
    if (daysLeft <= 15) return <Clock size={14} color="#D97706" />;
    return <CheckCircle2 size={14} color="#059669" />;
  };

  const getStatusStyle = (daysLeft: number) => {
    if (daysLeft < 0) return { bg: "#FEF2F2", border: "#FECACA", color: "#DC2626", badge: "#DC2626", badgeTxt: "Overdue" };
    if (daysLeft <= 9) return { bg: "#FEF2F2", border: "#FECACA", color: "#DC2626", badge: "#DC2626", badgeTxt: "Critical" };
    if (daysLeft <= 15) return { bg: "#FFFBEB", border: "#FDE68A", color: "#D97706", badge: "#F59E0B", badgeTxt: "Approaching" };
    return { bg: "#F0FDF4", border: "#BBF7D0", color: "#059669", badge: "#10B981", badgeTxt: "On Schedule" };
  };

  const monthsInView = selectedMonth ? [selectedMonth] : MONTHS;

  return (
    <AppShell title="Compliance Calendar" subtitle={`FY ${selectedFY} — Monthly compliance due date tracker`}>
      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div className="search-wrapper" style={{ flex: 1, maxWidth: 320 }}>
          <Search className="search-icon" />
          <input
            className="search-input"
            placeholder="Search client, package or service..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button
            className={`btn-slds ${viewMode === "calendar" ? "btn-slds-primary" : "btn-slds-secondary"}`}
            style={{ padding: "6px 14px", fontSize: 12 }}
            onClick={() => setViewMode("calendar")}
          >
            <Calendar size={13} /> Calendar
          </button>
          <button
            className={`btn-slds ${viewMode === "list" ? "btn-slds-primary" : "btn-slds-secondary"}`}
            style={{ padding: "6px 14px", fontSize: 12 }}
            onClick={() => setViewMode("list")}
          >
            List View
          </button>
        </div>

        {selectedMonth && (
          <button
            className="btn-slds btn-slds-secondary"
            style={{ padding: "6px 14px", fontSize: 12 }}
            onClick={() => setSelectedMonth(null)}
          >
            ← All Months
          </button>
        )}
      </div>

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Compliances", value: dueItems.length, color: "#1D4ED8", bg: "#EFF6FF" },
          { label: "Overdue", value: dueItems.filter(i => i.daysLeft < 0).length, color: "#DC2626", bg: "#FEF2F2" },
          { label: "Due in 15 Days", value: dueItems.filter(i => i.daysLeft >= 0 && i.daysLeft <= 15).length, color: "#D97706", bg: "#FFFBEB" },
          { label: "On Schedule", value: dueItems.filter(i => i.daysLeft > 15).length, color: "#059669", bg: "#F0FDF4" },
        ].map(stat => (
          <div key={stat.label} style={{ background: stat.bg, borderRadius: 12, padding: "14px 18px", border: `1px solid ${stat.bg}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: stat.color, textTransform: "uppercase" }}>{stat.label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: stat.color, marginTop: 4 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* ─── CALENDAR VIEW ─── */}
      {viewMode === "calendar" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {MONTHS.map(month => {
            const items = itemsByMonth[month] || [];
            const overdue = items.filter(i => i.daysLeft < 0).length;
            const critical = items.filter(i => i.daysLeft >= 0 && i.daysLeft <= 9).length;
            const hasUrgent = overdue > 0 || critical > 0;

            return (
              <div
                key={month}
                style={{
                  background: "white",
                  border: hasUrgent ? "2px solid #FCA5A5" : "1px solid #E2E8F0",
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: hasUrgent ? "0 4px 12px rgba(220, 38, 38, 0.1)" : "0 1px 3px rgba(0,0,0,0.06)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onClick={() => { setSelectedMonth(month); setViewMode("list"); }}
              >
                {/* Month Header */}
                <div style={{
                  padding: "12px 16px",
                  background: hasUrgent ? "linear-gradient(135deg, #7F1D1D, #DC2626)" : "linear-gradient(135deg, #0F172A, #1E293B)",
                  color: "white",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{month}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
                      FY {selectedFY} • {monthYearMap[month]?.year}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{items.length}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>Due items</div>
                  </div>
                </div>

                {/* Month Body */}
                <div style={{ padding: "12px 16px" }}>
                  {items.length === 0 ? (
                    <div style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", padding: "12px 0" }}>
                      ✓ No compliance due this month
                    </div>
                  ) : (
                    <>
                      {/* Status summary */}
                      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                        {overdue > 0 && (
                          <span style={{ background: "#FEF2F2", color: "#DC2626", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                            🔴 {overdue} Overdue
                          </span>
                        )}
                        {critical > 0 && (
                          <span style={{ background: "#FEF2F2", color: "#DC2626", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                            ⚠️ {critical} Critical
                          </span>
                        )}
                        {items.filter(i => i.daysLeft >= 10 && i.daysLeft <= 15).length > 0 && (
                          <span style={{ background: "#FFFBEB", color: "#D97706", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                            🟡 {items.filter(i => i.daysLeft >= 10 && i.daysLeft <= 15).length} Approaching
                          </span>
                        )}
                      </div>

                      {/* First 3 items preview */}
                      {items.slice(0, 3).map((item: any) => (
                        <div key={item.id} style={{ fontSize: 12, padding: "5px 0", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: 700, color: "#0F172A" }}>{item.name}</div>
                            <div style={{ color: "#64748B", fontSize: 11 }}>{item.subs?.length || 0} sub-services</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            {getStatusIcon(item.daysLeft)}
                            <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>{formatDate(item.dueDateStr)}</div>
                          </div>
                        </div>
                      ))}

                      {items.length > 3 && (
                        <div style={{ fontSize: 12, color: "#0176D3", fontWeight: 600, marginTop: 8, textAlign: "center" }}>
                          +{items.length - 3} more • Click to view all
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── LIST VIEW ─── */}
      {viewMode === "list" && (
        <div>
          {selectedMonth ? (
            <div className="data-table-wrapper">
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 12 }}>
                <Calendar size={18} color="#0176D3" />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#0F172A" }}>{selectedMonth} {monthYearMap[selectedMonth]?.year}</div>
                  <div style={{ fontSize: 12, color: "#64748B" }}>{(itemsByMonth[selectedMonth] || []).length} compliance items</div>
                </div>
              </div>
              <MonthListView items={itemsByMonth[selectedMonth] || []} getStatusStyle={getStatusStyle} getWhatsAppLink={getWhatsAppLink} formatDate={formatDate} formatCurrency={formatCurrency} />
            </div>
          ) : (
            MONTHS.map(month => {
              const items = itemsByMonth[month] || [];
              if (items.length === 0) return null;
              return (
                <div key={month} className="data-table-wrapper" style={{ marginBottom: 16 }}>
                  <div style={{ padding: "12px 20px", borderBottom: "1px solid #F1F5F9", background: "#F8FAFC", display: "flex", alignItems: "center", gap: 10 }}>
                    <Calendar size={16} color="#0176D3" />
                    <span style={{ fontWeight: 700, color: "#0F172A" }}>{month} {monthYearMap[month]?.year}</span>
                    <span className="chip" style={{ background: "#EFF6FF", color: "#1D4ED8", fontSize: 11 }}>{items.length} items</span>
                  </div>
                  <MonthListView items={items} getStatusStyle={getStatusStyle} getWhatsAppLink={getWhatsAppLink} formatDate={formatDate} formatCurrency={formatCurrency} />
                </div>
              );
            })
          )}

          {dueItems.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#94A3B8" }}>
              <Calendar size={40} color="#CBD5E1" style={{ margin: "0 auto 12px" }} />
              <div style={{ fontSize: 15, fontWeight: 600 }}>No compliance items found</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>
                {search ? `No results for "${search}"` : "Add Services with a due date in the Services section to see compliance due dates here"}
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

function MonthListView({ items, getStatusStyle, getWhatsAppLink, formatDate, formatCurrency }: any) {
  return (
    <div className="table-scroll-container">
      <table>
        <thead>
          <tr>
            <th className="col-num">#</th>
            <th>Service (Package) Name</th>
            <th>Sub-Services</th>
            <th>Due Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: any, i: number) => {
            const style = getStatusStyle(item.daysLeft);
            return (
              <tr key={item.id}>
                <td className="col-num">{i + 1}</td>
                <td style={{ fontWeight: 800, color: "#0F172A" }}>
                  {item.name}
                  {item.recurrence && (
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{item.recurrence}</div>
                  )}
                </td>
                <td>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {item.subs?.map((ss: any) => (
                      <span key={ss.id} className="chip" style={{ background: "#F1F5F9", color: "#334155", fontSize: 10 }}>{ss.name}</span>
                    ))}
                    {(!item.subs || item.subs.length === 0) && <span style={{ color: "#94A3B8", fontSize: 11 }}>No sub-services</span>}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 700, color: style.color, fontSize: 13 }}>
                    {formatDate(item.dueDateStr)}
                  </div>
                </td>
                <td>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: style.bg, border: `1px solid ${style.border}`, color: style.color, fontWeight: 700, fontSize: 12 }}>
                    {item.daysLeft < 0 ? `🔴 ${Math.abs(item.daysLeft)}d Overdue` :
                     item.daysLeft <= 9 ? `🔴 ${item.daysLeft}d Critical` :
                     item.daysLeft <= 15 ? `🟡 ${item.daysLeft}d Left` :
                     `🟢 ${item.daysLeft}d Left`}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
