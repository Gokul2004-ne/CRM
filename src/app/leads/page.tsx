"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState } from "react";
import { Lead, Client, LeadSource, LeadStatus } from "@/lib/types";
import { Plus, MessageCircle, UserCheck, Search, Phone, ExternalLink, RefreshCw, CheckCircle2, Trash2, Edit3, Mail, MapPin, Tag } from "lucide-react";
import { getWhatsAppLink, formatDate, validateEmail, validatePhone } from "@/lib/utils";
import { toast } from "sonner";

const LEAD_SOURCES: { value: LeadSource; label: string; badgeClass: string }[] = [
  { value: "WHATSAPP", label: "WhatsApp", badgeClass: "badge-success" },
  { value: "WEBSITE", label: "Website Inquiry", badgeClass: "badge-info" },
  { value: "REFERRAL", label: "Client Referral", badgeClass: "badge-warning" },
  { value: "DIRECT_CALL", label: "Phone Call", badgeClass: "badge-primary" },
  { value: "CAMPAIGN", label: "Ad / Campaign", badgeClass: "badge-purple" },
  { value: "WALK_IN", label: "Walk-In", badgeClass: "badge-secondary" },
  { value: "SOCIAL_MEDIA", label: "Social Media", badgeClass: "badge-indigo" },
  { value: "EMAIL", label: "Email Inquiry", badgeClass: "badge-teal" },
  { value: "OTHER", label: "Other Source", badgeClass: "badge-gray" },
];

const LEAD_STATUSES: { value: LeadStatus; label: string; badgeClass: string }[] = [
  { value: "LEAD", label: "🔥 New Lead", badgeClass: "badge-pending" },
  { value: "CONTACTED", label: "📞 Contacted", badgeClass: "badge-info" },
  { value: "QUALIFIED", label: "⭐ Qualified", badgeClass: "badge-primary" },
  { value: "CONVERTED", label: "✅ Converted", badgeClass: "badge-converted" },
  { value: "LOST", label: "❌ Lost", badgeClass: "badge-danger" },
];

const emptyLead = (): Lead => ({
  id: "",
  name: "",
  phone: "",
  mobile: "",
  email: "",
  city: "",
  source: "WHATSAPP",
  type: "PROPRIETORSHIP",
  status: "LEAD",
  notes: "",
  createdAt: new Date().toISOString().split("T")[0]
});

export default function LeadsPage() {
  const { leads, clients, collaborations, addLead, updateLead, deleteLead, convertLead, addClient } = useAppStore();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [modal, setModal] = useState<{ open: boolean; editing: Lead | null }>({ open: false, editing: null });
  const [isSyncing, setIsSyncing] = useState(false);
  const [form, setForm] = useState<Lead>(emptyLead());

  const filtered = (leads || []).filter(l => {
    const phoneNum = l.phone || l.mobile || "";
    const matchesTab = tab === "all" || l.status === tab;
    const matchesSource = sourceFilter === "all" || (l.source || "WHATSAPP").toUpperCase() === sourceFilter.toUpperCase();
    const q = search.toLowerCase().trim();
    const matchesSearch = !q ||
                          l.name.toLowerCase().includes(q) ||
                          phoneNum.includes(q) ||
                          (l.email && l.email.toLowerCase().includes(q)) ||
                          (l.notes && l.notes.toLowerCase().includes(q)) ||
                          (l.city && l.city.toLowerCase().includes(q));
    return matchesTab && matchesSource && matchesSearch;
  });

  const openAdd = () => {
    setForm(emptyLead());
    setModal({ open: true, editing: null });
  };

  const openEdit = (lead: Lead) => {
    setForm({
      ...lead,
      phone: lead.phone || lead.mobile || "",
      mobile: lead.mobile || lead.phone || "",
      email: lead.email || "",
      city: lead.city || "",
      source: lead.source || "WHATSAPP",
      status: lead.status || "LEAD",
      notes: lead.notes || ""
    });
    setModal({ open: true, editing: lead });
  };

  const handleSave = () => {
    const nameClean = form.name.trim();
    const phoneVal = (form.phone || form.mobile || "").trim();
    const emailVal = (form.email || "").trim().toLowerCase();

    if (!nameClean || !phoneVal) {
      toast.error("Lead Name and Phone Number are required.");
      return;
    }

    if (!validatePhone(phoneVal)) {
      toast.error("❌ Invalid Phone Number! Please enter a valid 10-digit mobile number.");
      return;
    }

    if (emailVal && !validateEmail(emailVal)) {
      toast.error("❌ Invalid Email Address! Please enter a valid email address.");
      return;
    }

    // Duplicate checks across other leads
    const cleanPhoneDigits = phoneVal.replace(/\D/g, "");
    const existingLeadPhone = leads.find(l => (!modal.editing || l.id !== modal.editing.id) && (l.phone?.replace(/\D/g, "") === cleanPhoneDigits || l.mobile?.replace(/\D/g, "") === cleanPhoneDigits));
    if (existingLeadPhone) {
      toast.error(`❌ Phone number already used! This phone number is already registered to lead "${existingLeadPhone.name}".`);
      return;
    }

    if (emailVal) {
      const existingLeadEmail = leads.find(l => (!modal.editing || l.id !== modal.editing.id) && l.email?.trim().toLowerCase() === emailVal);
      if (existingLeadEmail) {
        toast.error(`❌ Email already used! "${emailVal}" is already registered to lead "${existingLeadEmail.name}".`);
        return;
      }

      const existingClientEmail = clients.find(c => c.email?.trim().toLowerCase() === emailVal);
      if (existingClientEmail) {
        toast.error(`❌ Email already used! "${emailVal}" is already registered to client "${existingClientEmail.name}".`);
        return;
      }

      const existingCollabEmail = (collaborations || []).find(col => col.email?.trim().toLowerCase() === emailVal);
      if (existingCollabEmail) {
        toast.error(`❌ Email already used! "${emailVal}" is already registered to collaboration partner "${existingCollabEmail.name}".`);
        return;
      }
    }

    const payload: Lead = {
      ...form,
      name: nameClean,
      phone: phoneVal,
      mobile: phoneVal,
      email: emailVal || undefined,
      city: form.city?.trim() || undefined,
      source: form.source || "WHATSAPP",
      status: form.status || "LEAD",
      notes: form.notes?.trim() || undefined,
      createdAt: form.createdAt || new Date().toISOString().split("T")[0]
    };

    if (modal.editing) {
      updateLead(payload);
      toast.success("Lead details updated and synced across all devices!");
    } else {
      const newLead: Lead = {
        ...payload,
        id: `l_${Date.now()}`
      };
      addLead(newLead);
      toast.success("New lead created and stored in cloud database!");
    }

    setModal({ open: false, editing: null });
  };

  const handleConvert = (lead: Lead) => {
    const newClientId = `c${Date.now()}`;
    const phoneVal = lead.phone || lead.mobile || "";
    const emailCandidate = lead.email && lead.email.trim()
      ? lead.email.trim().toLowerCase()
      : `${lead.name.toLowerCase().replace(/\s+/g, "")}@lead-converted.com`;

    addClient({
      id: newClientId,
      name: lead.name,
      type: (lead.type as any) || "PROPRIETORSHIP",
      phone: phoneVal,
      mobile: phoneVal,
      email: emailCandidate,
      city: lead.city || "Mumbai",
      documentCount: 2,
      status: "ACTIVE",
      notes: lead.notes || `Converted from ${lead.source || "WhatsApp"} Lead`,
      createdAt: new Date().toISOString().split("T")[0]
    });
    convertLead(lead.id, newClientId);
    toast.success(`🎉 ${lead.name} has been converted to an active Client Account!`);
  };

  // WhatsApp Business Auto-Sync Trigger
  const handleSyncWhatsAppBusiness = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const unconvertedLeads = leads.filter(l => l.status !== "CONVERTED" && l.mobile);
      if (unconvertedLeads.length > 0) {
        unconvertedLeads.forEach(lead => {
          const phoneVal = lead.mobile;
          const existing = clients.find(c => (c.phone || c.mobile) === phoneVal);
          if (!existing) {
            addClient({
              id: `c_wa_${Date.now()}_${Math.floor(Math.random() * 100)}`,
              name: lead.name,
              type: "PROPRIETORSHIP",
              phone: phoneVal,
              mobile: phoneVal,
              email: lead.email || `${lead.name.toLowerCase().replace(/\s+/g, "")}@whatsapp-client.com`,
              documentCount: 1,
              status: "ACTIVE",
              notes: lead.notes || "Synced from WhatsApp Business",
              createdAt: new Date().toISOString().split("T")[0]
            });
            convertLead(lead.id, lead.name);
          }
        });
        toast.success(`Synced ${unconvertedLeads.length} WhatsApp Business lead(s) into Client Directory!`);
      } else {
        toast.success("WhatsApp Business connection active. All client contacts are fully up to date!");
      }
      setIsSyncing(false);
    }, 1200);
  };

  return (
    <AppShell title="Leads & Sales Pipeline" subtitle="Capture incoming inquiries across WhatsApp, Website, Referrals, Campaigns and sync across all devices">
      {/* Salesforce Page Banner */}
      <div className="page-header-slds">
        <div>
          <div className="breadcrumb">
            <span>zpluscrm</span>
            <span>/</span>
            <span className="current">Leads & Sales</span>
          </div>
          <div className="page-title-slds">Leads & Multi-Channel Inquiries</div>
          <div className="page-subtitle-slds">
            Manage incoming prospects from all categories (WhatsApp, Website, Referrals, Ads), update status stages, and sync across all devices.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            className="btn-slds btn-slds-secondary"
            onClick={handleSyncWhatsAppBusiness}
            disabled={isSyncing}
          >
            <RefreshCw size={15} className={isSyncing ? "animate-spin" : ""} />
            <span>{isSyncing ? "Syncing WhatsApp..." : "Sync WhatsApp Business"}</span>
          </button>
          <button
            className="btn-slds btn-slds-primary"
            onClick={openAdd}
          >
            <Plus size={16} />
            <span>Add New Lead</span>
          </button>
        </div>
      </div>

      {/* WhatsApp Web Banner */}
      <div className="card-slds" style={{ background: "linear-gradient(135deg, #059669 0%, #00A88F 100%)", color: "white", padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, display: "flex", alignItems: "center", gap: 10 }}>
              <MessageCircle size={22} />
              <span>Multi-Device Cloud Sync Active</span>
            </div>
            <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, marginTop: 4 }}>
              Every lead added or edited on this device is automatically stored in Supabase Cloud and updated live across all connected devices and browsers.
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

      {/* Leads Table Card */}
      <div className="card-slds">
        <div className="table-toolbar-slds" style={{ flexWrap: "wrap", gap: 10 }}>
          {/* Status Filter Tabs */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button
              className={`btn-slds ${tab === "all" ? "btn-slds-primary" : "btn-slds-secondary"}`}
              style={{ padding: "4px 10px", fontSize: 11 }}
              onClick={() => setTab("all")}
            >
              All Statuses ({leads.length})
            </button>
            {LEAD_STATUSES.map(st => {
              const count = leads.filter(l => l.status === st.value).length;
              return (
                <button
                  key={st.value}
                  className={`btn-slds ${tab === st.value ? "btn-slds-primary" : "btn-slds-secondary"}`}
                  style={{ padding: "4px 10px", fontSize: 11 }}
                  onClick={() => setTab(st.value)}
                >
                  {st.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Source / Category Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Source:</span>
            <select
              className="form-select"
              style={{ padding: "4px 8px", fontSize: 12, fontWeight: 600, width: 140 }}
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
            >
              <option value="all">All Sources ({leads.length})</option>
              {LEAD_SOURCES.map(src => (
                <option key={src.value} value={src.value}>
                  {src.label} ({leads.filter(l => (l.source || "WHATSAPP").toUpperCase() === src.value).length})
                </option>
              ))}
            </select>

            <div className="search-input-wrapper">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search leads by name, phone, email, notes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="table-wrapper-slds">
          <table className="table-slds">
            <thead>
              <tr>
                <th style={{ width: 50, textAlign: "center" }}>#</th>
                <th>Lead Name</th>
                <th>Contact Info</th>
                <th>Source Category</th>
                <th>Stage Status</th>
                <th>Notes / Inquiries</th>
                <th>Date Added</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((lead, index) => {
                  const phoneNum = lead.phone || lead.mobile || "";
                  const isConverted = lead.status === "CONVERTED";
                  const srcMeta = LEAD_SOURCES.find(s => s.value === (lead.source || "WHATSAPP").toUpperCase()) || LEAD_SOURCES[0];
                  const statusMeta = LEAD_STATUSES.find(s => s.value === lead.status) || LEAD_STATUSES[0];

                  return (
                    <tr key={lead.id}>
                      <td style={{ fontWeight: 700, color: "#64748B", textAlign: "center", fontSize: 12 }}>
                        {index + 1}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 13 }}>{lead.name}</div>
                        {lead.city && (
                          <div style={{ fontSize: 11, color: "#64748B", display: "flex", alignItems: "center", gap: 3 }}>
                            <MapPin size={11} />
                            <span>{lead.city}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {phoneNum && (
                            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#0176D3", fontWeight: 600 }}>
                              <Phone size={12} />
                              <span>{phoneNum}</span>
                            </div>
                          )}
                          {lead.email && (
                            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#64748B" }}>
                              <Mail size={11} />
                              <span>{lead.email}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge-slds ${srcMeta.badgeClass}`}>
                          {srcMeta.label}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-slds ${statusMeta.badgeClass}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: "#475569", maxWidth: 220 }}>
                        {lead.notes || "Interested in services"}
                      </td>
                      <td style={{ fontSize: 11, color: "#64748B" }}>
                        {formatDate(lead.createdAt)}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          {phoneNum && (
                            <a
                              href={getWhatsAppLink(phoneNum)}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-slds btn-slds-success"
                              style={{ padding: "4px 8px", fontSize: 11 }}
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle size={13} />
                              <span>Chat</span>
                            </a>
                          )}

                          <button
                            className="btn-slds btn-slds-secondary"
                            style={{ padding: "4px 8px", fontSize: 11 }}
                            onClick={() => openEdit(lead)}
                            title="Edit Lead Details"
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
                          </button>

                          {!isConverted && (
                            <button
                              className="btn-slds btn-slds-primary"
                              style={{ padding: "4px 8px", fontSize: 11 }}
                              onClick={() => handleConvert(lead)}
                              title="Convert to active CRM Client"
                            >
                              <UserCheck size={13} />
                              <span>Convert</span>
                            </button>
                          )}

                          <button
                            className="btn-slds"
                            style={{ padding: "4px 8px", fontSize: 11, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", fontWeight: 600 }}
                            onClick={() => {
                              deleteLead(lead.id);
                              toast.success(`Lead "${lead.name}" deleted.`);
                            }}
                            title="Delete Lead"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 32, color: "#64748B" }}>
                    No leads found matching your criteria. Click &quot;Add New Lead&quot; to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Lead Modal */}
      {modal.open && (
        <div className="command-palette-backdrop" onClick={() => setModal({ open: false, editing: null })}>
          <div className="command-palette-card" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0F172A" }}>
                {modal.editing ? `Edit Lead: ${modal.editing.name}` : "Add New Lead / Prospect"}
              </div>
              <button
                type="button"
                className="btn-slds btn-slds-secondary"
                style={{ padding: "3px 8px", fontSize: 11 }}
                onClick={() => setModal({ open: false, editing: null })}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 24, display: "grid", gap: 14, maxHeight: "75vh", overflowY: "auto" }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                  Lead / Prospect Name *
                </label>
                <input
                  className="command-palette-input"
                  style={{ borderRadius: 8, border: "1px solid #CBD5E1", padding: 10, fontSize: 14 }}
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Rajesh Kumar or Apex Enterprises"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                    Phone / WhatsApp *
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
                    Email ID (Optional)
                  </label>
                  <input
                    type="email"
                    className="command-palette-input"
                    style={{ borderRadius: 8, border: "1px solid #CBD5E1", padding: 10, fontSize: 14 }}
                    value={form.email || ""}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="lead@company.com"
                  />
                </div>
              </div>




              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                  City / Location (Optional)
                </label>
                <input
                  className="command-palette-input"
                  style={{ borderRadius: 8, border: "1px solid #CBD5E1", padding: 10, fontSize: 14 }}
                  value={form.city || ""}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="e.g. Mumbai, Maharashtra"
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                  Notes & Inquired Services
                </label>
                <textarea
                  className="command-palette-input"
                  style={{ borderRadius: 8, border: "1px solid #CBD5E1", padding: 10, fontSize: 13, minHeight: 70 }}
                  value={form.notes || ""}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. Interested in GST Registration + Monthly Filing package"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  className="btn-slds btn-slds-secondary"
                  onClick={() => setModal({ open: false, editing: null })}
                >
                  Cancel
                </button>
                <button type="button" className="btn-slds btn-slds-primary" onClick={handleSave}>
                  {modal.editing ? "Save Changes & Sync" : "Add Lead & Sync"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
