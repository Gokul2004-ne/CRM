"use client";
import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import {
  Search, Users, MessageSquare, Briefcase, Layers,
  FileText, ClipboardList, Building2, Calendar, PenTool,
  Settings, ArrowRight, X
} from "lucide-react";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { clients, leads, services, subServices } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const navigateTo = (path: string) => {
    router.push(path);
    onClose();
  };

  const navResults = [
    { label: "Dashboard", path: "/", icon: Search },
    { label: "Clients", path: "/clients", icon: Users },
    { label: "WhatsApp Leads", path: "/leads", icon: MessageSquare },
    { label: "Services", path: "/services", icon: Briefcase },
    { label: "Sub Services", path: "/sub-services", icon: Layers },
    { label: "Required Docs", path: "/required-docs", icon: FileText },
    { label: "Assign Services", path: "/assign", icon: ClipboardList },
    { label: "Banking", path: "/banking", icon: Building2 },
    { label: "Due Dates", path: "/due-dates", icon: Calendar },
    { label: "Document Drafts", path: "/drafts", icon: PenTool },
    { label: "Settings", path: "/settings", icon: Settings },
  ].filter(item => item.label.toLowerCase().includes(query.toLowerCase()));

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.pan?.toLowerCase().includes(query.toLowerCase()) ||
    c.gstin?.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  const filteredLeads = leads.filter(l =>
    l.name.toLowerCase().includes(query.toLowerCase()) ||
    (l.phone || l.mobile || "").includes(query)
  ).slice(0, 4);

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  return (
    <div className="command-palette-backdrop" onClick={onClose}>
      <div className="command-palette-card" onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingRight: 16 }}>
          <Search size={20} style={{ marginLeft: 16, color: "#94A3B8" }} />
          <input
            autoFocus
            type="text"
            className="command-palette-input"
            placeholder="Search Clients, Leads, Services, or jump to page... (Press Esc to close)"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}>
            <X size={18} />
          </button>
        </div>

        <div className="command-palette-results">
          {/* Navigation Pages */}
          {navResults.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94A3B8", padding: "6px 12px" }}>
                Pages & Navigation
              </div>
              {navResults.map((item) => (
                <div key={item.path} className="command-item" onClick={() => navigateTo(item.path)}>
                  <item.icon size={16} color="#0176D3" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{item.label}</span>
                  <ArrowRight size={14} style={{ marginLeft: "auto", color: "#CBD5E1" }} />
                </div>
              ))}
            </div>
          )}

          {/* Matching Clients */}
          {query.trim().length > 0 && filteredClients.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94A3B8", padding: "6px 12px" }}>
                Clients ({filteredClients.length})
              </div>
              {filteredClients.map((client) => (
                <div key={client.id} className="command-item" onClick={() => navigateTo("/clients")}>
                  <Users size={16} color="#10B981" />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{client.name}</div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>PAN: {client.pan} | Type: {client.type}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Matching Leads */}
          {query.trim().length > 0 && filteredLeads.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94A3B8", padding: "6px 12px" }}>
                WhatsApp Leads ({filteredLeads.length})
              </div>
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="command-item" onClick={() => navigateTo("/leads")}>
                  <MessageSquare size={16} color="#F59E0B" />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{lead.name}</div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>Phone: {lead.phone} | Status: {lead.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Matching Services */}
          {query.trim().length > 0 && filteredServices.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94A3B8", padding: "6px 12px" }}>
                Services ({filteredServices.length})
              </div>
              {filteredServices.map((service) => (
                <div key={service.id} className="command-item" onClick={() => navigateTo("/services")}>
                  <Briefcase size={16} color="#8B5CF6" />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{service.name}</div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>Pricing: ₹{service.price}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {query.trim().length > 0 && navResults.length === 0 && filteredClients.length === 0 && filteredLeads.length === 0 && filteredServices.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: "#64748B", fontSize: 14 }}>
              No matches found for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
