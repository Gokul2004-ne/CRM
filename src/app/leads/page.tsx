"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState } from "react";
import { Lead } from "@/lib/types";
import { Plus, MessageCircle, UserCheck, Search, Phone, ExternalLink, Sparkles } from "lucide-react";
import { getWhatsAppLink, formatDate } from "@/lib/utils";
import { toast } from "sonner";

const empty = (): Lead => ({
  id: "",
  name: "",
  phone: "",
  mobile: "",
  source: "WHATSAPP",
  status: "LEAD",
  notes: "",
  createdAt: new Date().toISOString().split("T")[0]
});

export default function LeadsPage() {
  const { leads, addLead, convertLead, addClient } = useAppStore();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "LEAD" | "CONVERTED">("all");
  const [modal, setModal] = useState<{ open: boolean; adding: boolean }>({ open: false, adding: false });
  const [form, setForm] = useState<Lead>(empty());

  const filtered = leads.filter(l => {
    const phoneNum = l.phone || l.mobile || "";
    const matchesTab = tab === "all" || l.status === tab;
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) || phoneNum.includes(search);
    return matchesTab && matchesSearch;
  });

  const handleAddLead = () => {
    const phoneVal = form.phone || form.mobile;
    if (!form.name || !phoneVal) {
      toast.error("Lead Name and Phone Number are required.");
      return;
    }
    addLead({ ...form, phone: phoneVal, mobile: phoneVal, id: `l${Date.now()}` });
    toast.success("New WhatsApp Lead added successfully!");
    setModal({ open: false, adding: false });
  };

  const handleConvert = (lead: Lead) => {
    const newClientId = `c${Date.now()}`;
    const phoneVal = lead.phone || lead.mobile || "";
    addClient({
      id: newClientId,
      name: lead.name,
      type: "PROPRIETORSHIP",
      phone: phoneVal,
      mobile: phoneVal,
      email: "",
      status: "ACTIVE",
      notes: lead.notes || "Converted from WhatsApp Lead",
      createdAt: new Date().toISOString().split("T")[0]
    });
    convertLead(lead.id, newClientId);
    toast.success(`🎉 ${lead.name} has been converted to an active Client Account!`);
  };

  return (
    <AppShell title="WhatsApp Leads & Sales" subtitle="Capture incoming inquiries, stage leads, and convert them to clients">
      {/* Salesforce Page Banner */}
      <div className="page-header-slds">
        <div>
          <div className="breadcrumb">
            <span>Salesforce CRM</span>
            <span>/</span>
            <span className="current">WhatsApp Leads</span>
          </div>
          <div className="page-title-slds">WhatsApp Leads Pipeline</div>
          <div className="page-subtitle-slds">
            Manage incoming prospects and turn inquiries into client contracts.
          </div>
        </div>
        <button
          className="btn-slds btn-slds-primary"
          onClick={() => { setForm(empty()); setModal({ open: true, adding: true }); }}
        >
          <Plus size={16} />
          <span>Add New Lead</span>
        </button>
      </div>

      {/* WhatsApp Web Banner */}
      <div className="card-slds" style={{ background: "linear-gradient(135deg, #059669 0%, #00A88F 100%)", color: "white", padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, display: "flex", alignItems: "center", gap: 10 }}>
              <MessageCircle size={24} />
              <span>WhatsApp Web Sales Integration</span>
            </div>
            <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 4 }}>
              Directly launch WhatsApp chat windows to send quotes, due-date notices, and billing reminders.
            </div>
          </div>
          <a
            href="https://web.whatsapp.com"
            target="_blank"
            rel="noreferrer"
            className="btn-slds"
            style={{ background: "white", color: "#059669", fontWeight: 700 }}
          >
            <ExternalLink size={15} />
            <span>Open WhatsApp Web</span>
          </a>
        </div>
      </div>

      {/* Leads Table */}
      <div className="card-slds">
        <div className="table-toolbar-slds">
          <div style={{ display: "flex", gap: 8 }}>
            {(["all", "LEAD", "CONVERTED"] as const).map(t => (
              <button
                key={t}
                className={`btn-slds ${tab === t ? "btn-slds-primary" : "btn-slds-secondary"}`}
                style={{ padding: "4px 12px", fontSize: 12 }}
                onClick={() => setTab(t)}
              >
                {t === "all" ? `All Leads (${leads.length})` : t === "LEAD" ? `Active (${leads.filter(l => l.status === "LEAD").length})` : `Converted (${leads.filter(l => l.status === "CONVERTED").length})`}
              </button>
            ))}
          </div>

          <div className="search-input-wrapper">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search leads by name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrapper-slds">
          <table className="table-slds">
            <thead>
              <tr>
                <th>Lead Name</th>
                <th>Phone Number</th>
                <th>Source</th>
                <th>Status Stage</th>
                <th>Notes</th>
                <th>Date Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((lead) => {
                  const phoneNum = lead.phone || lead.mobile || "";
                  const isConverted = lead.status === "CONVERTED";

                  return (
                    <tr key={lead.id}>
                      <td style={{ fontWeight: 700, color: "#0F172A" }}>{lead.name}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#0176D3", fontWeight: 600 }}>
                          <Phone size={13} />
                          <span>{phoneNum}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge-slds badge-new">{lead.source || "WHATSAPP"}</span>
                      </td>
                      <td>
                        <span className={`badge-slds ${isConverted ? "badge-converted" : "badge-pending"}`}>
                          {isConverted ? "✅ Converted" : "🔥 Active Prospect"}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: "#64748B", maxWidth: 220 }}>
                        {lead.notes || "Interested in GST & Income Tax filing"}
                      </td>
                      <td style={{ fontSize: 12, color: "#64748B" }}>
                        {formatDate(lead.createdAt)}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          {phoneNum && (
                            <a
                              href={getWhatsAppLink(phoneNum)}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-slds btn-slds-success"
                              style={{ padding: "4px 10px", fontSize: 11 }}
                            >
                              <MessageCircle size={13} />
                              <span>Chat</span>
                            </a>
                          )}

                          {!isConverted && (
                            <button
                              className="btn-slds btn-slds-primary"
                              style={{ padding: "4px 10px", fontSize: 11 }}
                              onClick={() => handleConvert(lead)}
                            >
                              <UserCheck size={13} />
                              <span>Convert to Client</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#64748B" }}>
                    No leads found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lead Modal */}
      {modal.open && (
        <div className="command-palette-backdrop" onClick={() => setModal({ open: false, adding: false })}>
          <div className="command-palette-card" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0F172A" }}>
                Add New WhatsApp Prospect
              </div>
            </div>
            <div style={{ padding: 24, display: "grid", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                  Prospect Name *
                </label>
                <input
                  className="command-palette-input"
                  style={{ borderRadius: 8, border: "1px solid #CBD5E1", padding: 10, fontSize: 14 }}
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Rajesh Kumar"
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                  WhatsApp Phone Number *
                </label>
                <input
                  className="command-palette-input"
                  style={{ borderRadius: 8, border: "1px solid #CBD5E1", padding: 10, fontSize: 14 }}
                  value={form.phone || form.mobile}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value, mobile: e.target.value }))}
                  placeholder="9876543210"
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                  Notes & Inquired Services
                </label>
                <textarea
                  className="command-palette-input"
                  style={{ borderRadius: 8, border: "1px solid #CBD5E1", padding: 10, fontSize: 14, minHeight: 80 }}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. Wants GST Registration + Monthly Filing package"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  className="btn-slds btn-slds-secondary"
                  onClick={() => setModal({ open: false, adding: false })}
                >
                  Cancel
                </button>
                <button className="btn-slds btn-slds-primary" onClick={handleAddLead}>
                  Add Prospect Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
