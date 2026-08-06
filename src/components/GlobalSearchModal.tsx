"use client";
import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import {
  Search, Users, MessageSquare, Package, Layers,
  FileText, ClipboardList, Building2, Calendar, PenTool,
  Settings, ArrowRight, X, Handshake, Sparkles, LayoutDashboard, Receipt, CreditCard
} from "lucide-react";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { clients, leads, services, subServices, collaborations, oneTimeServices } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navigateTo = (path: string) => {
    router.push(path);
    onClose();
  };

  // Correct Navigation items corresponding exactly to Sidebar menu labels
  const navResults = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard, category: "Core CRM" },
    { label: "Clients", path: "/clients", icon: Users, category: "Core CRM" },
    { label: "Collaborations", path: "/collaborations", icon: Handshake, category: "Core CRM" },
    { label: "WhatsApp Leads", path: "/leads", icon: MessageSquare, category: "Core CRM" },
    { label: "Packages", path: "/services", icon: Package, category: "Operations & Packages" },
    { label: "Services", path: "/sub-services", icon: Layers, category: "Operations & Packages" },
    { label: "Required Docs", path: "/required-docs", icon: FileText, category: "Operations & Packages" },
    { label: "Assign Packages", path: "/assign", icon: ClipboardList, category: "Operations & Packages" },
    { label: "One Time Service", path: "/one-time-services", icon: Sparkles, category: "Operations & Packages" },
    { label: "Banking & Ledger", path: "/banking", icon: Building2, category: "Financials & Billing" },
    { label: "Compliance Calendar", path: "/due-dates", icon: Calendar, category: "Financials & Billing" },
    { label: "Invoices", path: "/invoice", icon: Receipt, category: "Financials & Billing" },
    { label: "Document Drafts", path: "/drafts", icon: PenTool, category: "Financials & Billing" },
    { label: "Subscription", path: "/subscription", icon: CreditCard, category: "Enterprise" },
    { label: "Settings", path: "/settings", icon: Settings, category: "Enterprise" },
  ].filter(item => item.label.toLowerCase().includes(query.toLowerCase()));

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.pan?.toLowerCase().includes(query.toLowerCase()) ||
    c.gstin?.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  const filteredCollaborations = (collaborations || []).filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.number.includes(query) ||
    c.email.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  const filteredLeads = leads.filter(l =>
    l.name.toLowerCase().includes(query.toLowerCase()) ||
    (l.phone || l.mobile || "").includes(query)
  ).slice(0, 4);

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  const filteredOneTime = (oneTimeServices || []).filter(ots =>
    ots.clientName.toLowerCase().includes(query.toLowerCase()) ||
    ots.serviceName.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(12px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "80px",
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "640px",
          background: "#0F172A",
          border: "1.5px solid #1E293B",
          borderRadius: "20px",
          boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(99, 102, 241, 0.2)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "80vh",
        }}
      >
        {/* Header Search Input Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid #1E293B",
            background: "#0F172A",
            gap: 12,
          }}
        >
          <Search size={20} style={{ color: "#6366F1", flexShrink: 0 }} />
          <input
            autoFocus
            type="text"
            placeholder="Search Clients, Leads, Packages, or jump to page..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "15px",
              fontWeight: 600,
              color: "#F8FAFC",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          />
          <button
            onClick={onClose}
            style={{
              background: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "6px",
              padding: "3px 8px",
              fontSize: "11px",
              fontWeight: 700,
              color: "#94A3B8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px 16px" }}>
          
          {/* Navigation Pages */}
          {navResults.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748B", padding: "4px 10px 8px" }}>
                Pages &amp; Navigation
              </div>
              {navResults.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.path}
                    onClick={() => navigateTo(item.path)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 12px",
                      borderRadius: "10px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      marginBottom: "2px",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.background = "#1E293B";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.background = "transparent";
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(99, 102, 241, 0.12)", border: "1px solid rgba(99, 102, 241, 0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={16} color="#818CF8" />
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#E2E8F0" }}>{item.label}</span>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#475569", marginLeft: "auto", background: "#1E293B", padding: "2px 8px", borderRadius: 4 }}>
                      {item.category}
                    </span>
                    <ArrowRight size={14} style={{ color: "#64748B" }} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Matching Clients */}
          {query.trim().length > 0 && filteredClients.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748B", padding: "4px 10px 8px" }}>
                Clients ({filteredClients.length})
              </div>
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => navigateTo("/clients")}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: "10px", cursor: "pointer", transition: "all 0.15s ease", marginBottom: "2px",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#1E293B"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Users size={16} color="#10B981" />
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#E2E8F0" }}>{client.name}</div>
                    <div style={{ fontSize: "11.5px", color: "#64748B" }}>PAN: {client.pan || "N/A"} | Mobile: {client.mobile}</div>
                  </div>
                  <ArrowRight size={14} style={{ marginLeft: "auto", color: "#64748B" }} />
                </div>
              ))}
            </div>
          )}

          {/* Matching One Time Services */}
          {query.trim().length > 0 && filteredOneTime.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748B", padding: "4px 10px 8px" }}>
                One Time Services ({filteredOneTime.length})
              </div>
              {filteredOneTime.map((ots) => (
                <div
                  key={ots.id}
                  onClick={() => navigateTo("/one-time-services")}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: "10px", cursor: "pointer", transition: "all 0.15s ease", marginBottom: "2px",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#1E293B"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(99, 102, 241, 0.12)", border: "1px solid rgba(99, 102, 241, 0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Sparkles size={16} color="#818CF8" />
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#E2E8F0" }}>{ots.serviceName}</div>
                    <div style={{ fontSize: "11.5px", color: "#64748B" }}>Client: {ots.clientName} | Progress: {ots.progress}</div>
                  </div>
                  <ArrowRight size={14} style={{ marginLeft: "auto", color: "#64748B" }} />
                </div>
              ))}
            </div>
          )}

          {/* Matching Collaborations */}
          {query.trim().length > 0 && filteredCollaborations.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748B", padding: "4px 10px 8px" }}>
                Collaborations ({filteredCollaborations.length})
              </div>
              {filteredCollaborations.map((collab) => (
                <div
                  key={collab.id}
                  onClick={() => navigateTo("/collaborations")}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: "10px", cursor: "pointer", transition: "all 0.15s ease", marginBottom: "2px",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#1E293B"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(14, 165, 233, 0.12)", border: "1px solid rgba(14, 165, 233, 0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Handshake size={16} color="#38BDF8" />
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#E2E8F0" }}>{collab.name}</div>
                    <div style={{ fontSize: "11.5px", color: "#64748B" }}>Number: {collab.number} | Email: {collab.email}</div>
                  </div>
                  <ArrowRight size={14} style={{ marginLeft: "auto", color: "#64748B" }} />
                </div>
              ))}
            </div>
          )}

          {/* Matching Leads */}
          {query.trim().length > 0 && filteredLeads.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748B", padding: "4px 10px 8px" }}>
                WhatsApp Leads ({filteredLeads.length})
              </div>
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => navigateTo("/leads")}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: "10px", cursor: "pointer", transition: "all 0.15s ease", marginBottom: "2px",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#1E293B"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <MessageSquare size={16} color="#FBBF24" />
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#E2E8F0" }}>{lead.name}</div>
                    <div style={{ fontSize: "11.5px", color: "#64748B" }}>Phone: {lead.phone || lead.mobile}</div>
                  </div>
                  <ArrowRight size={14} style={{ marginLeft: "auto", color: "#64748B" }} />
                </div>
              ))}
            </div>
          )}

          {/* Matching Packages */}
          {query.trim().length > 0 && filteredServices.length > 0 && (
            <div>
              <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748B", padding: "4px 10px 8px" }}>
                Packages ({filteredServices.length})
              </div>
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  onClick={() => navigateTo("/services")}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: "10px", cursor: "pointer", transition: "all 0.15s ease", marginBottom: "2px",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#1E293B"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(168, 85, 247, 0.12)", border: "1px solid rgba(168, 85, 247, 0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Package size={16} color="#C084FC" />
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#E2E8F0" }}>{service.name}</div>
                    <div style={{ fontSize: "11.5px", color: "#64748B" }}>Price: ₹{service.price}</div>
                  </div>
                  <ArrowRight size={14} style={{ marginLeft: "auto", color: "#64748B" }} />
                </div>
              ))}
            </div>
          )}

          {query.trim().length > 0 && navResults.length === 0 && filteredClients.length === 0 && filteredCollaborations.length === 0 && filteredLeads.length === 0 && filteredServices.length === 0 && filteredOneTime.length === 0 && (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "#64748B", fontSize: "14px", fontWeight: 600 }}>
              No matches found for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
