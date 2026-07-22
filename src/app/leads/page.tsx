"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState } from "react";
import { Lead } from "@/lib/types";
import { Plus, MessageCircle, UserCheck, Search, Phone } from "lucide-react";
import { getWhatsAppLink, formatDate } from "@/lib/utils";
import { toast } from "sonner";

const empty = (): Lead => ({ id: "", name: "", mobile: "", source: "WHATSAPP", status: "LEAD", notes: "", createdAt: new Date().toISOString().split("T")[0] });

export default function LeadsPage() {
  const { leads, clients, addLead, updateLead, convertLead, addClient } = useAppStore();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "LEAD" | "CONVERTED">("all");
  const [modal, setModal] = useState<{ open: boolean; converting: Lead | null; adding: boolean }>({ open: false, converting: null, adding: false });
  const [form, setForm] = useState<Lead>(empty());

  const filtered = leads.filter(l =>
    (tab === "all" || l.status === tab) &&
    (l.name.toLowerCase().includes(search.toLowerCase()) || l.mobile.includes(search))
  );

  const handleAddLead = () => {
    if (!form.name || !form.mobile) { toast.error("Name and mobile required"); return; }
    addLead({ ...form, id: `l${Date.now()}` });
    toast.success("Lead added");
    setModal({ open: false, converting: null, adding: false });
  };

  const handleConvert = (lead: Lead) => {
    const newClientId = `c${Date.now()}`;
    addClient({
      id: newClientId, name: lead.name, ownerName: lead.name,
      mobile: lead.mobile, email: "", referredBy: "WhatsApp Lead",
      acquiredDate: new Date().toISOString().split("T")[0],
      address: "", notes: lead.notes || ""
    });
    convertLead(lead.id, newClientId);
    toast.success(`${lead.name} converted to client successfully!`);
  };

  return (
    <AppShell title="WhatsApp Leads" subtitle="Manage and convert leads to clients">
      {/* WA Login Panel */}
      <div className="section-card" style={{ background: "linear-gradient(135deg, #25D366, #128C7E)", padding: "20px 24px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: "white", fontWeight: 800, fontSize: 18, display: "flex", alignItems: "center", gap: 10 }}>
              <MessageCircle size={24} /> WhatsApp Business Integration
            </div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 }}>
              Connect WhatsApp to automatically capture incoming messages as leads
            </div>
          </div>
          <a href="https://web.whatsapp.com" target="_blank" rel="noreferrer"
            className="btn" style={{ background: "white", color: "#128C7E", fontWeight: 700 }}>
            Open WhatsApp Web
          </a>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-header">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div className="tab-list">
              {(["all", "LEAD", "CONVERTED"] as const).map(t => (
                <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                  {t === "all" ? `All (${leads.length})` : t === "LEAD" ? `Leads (${leads.filter(l => l.status === "LEAD").length})` : `Converted (${leads.filter(l => l.status === "CONVERTED").length})`}
                </button>
              ))}
            </div>
            <div className="search-wrapper">
              <Search className="search-icon" />
              <input className="search-input" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => { setForm(empty()); setModal({ open: true, converting: null, adding: true }); }}>
            <Plus size={15} /> Add Lead
          </button>
        </div>
        <table>
          <thead>
            <tr><th>#</th><th>Name</th><th>Mobile</th><th>Status</th><th>Source</th><th>Notes</th><th>Date Added</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map((l, i) => (
              <tr key={l.id}>
                <td style={{ color: "#94A3B8", fontWeight: 600 }}>{i + 1}</td>
                <td style={{ fontWeight: 700, color: "#0F172A" }}>{l.name}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Phone size={12} color="#94A3B8" /> {l.mobile}
                  </div>
                </td>
                <td>
                  <span className={`badge ${l.status === "LEAD" ? "background:#FFF7ED;color:#C2410C" : "background:#F0FDF4;color:#15803D"}`}
                    style={l.status === "LEAD" ? { background: "#FFF7ED", color: "#C2410C" } : { background: "#F0FDF4", color: "#15803D" }}>
                    {l.status === "LEAD" ? "🔥 Lead" : "✅ Converted"}
                  </span>
                </td>
                <td><span className="chip">{l.source}</span></td>
                <td style={{ fontSize: 13, color: "#64748B" }}>{l.notes || "-"}</td>
                <td>{formatDate(l.createdAt)}</td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <a href={getWhatsAppLink(l.mobile)} target="_blank" rel="noreferrer" className="wa-btn">
                      <MessageCircle size={13} />
                    </a>
                    {l.status === "LEAD" && (
                      <button className="btn btn-success btn-sm" onClick={() => handleConvert(l)}>
                        <UserCheck size={13} /> Convert
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>No leads found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal.open && modal.adding && (
        <div className="modal-overlay" onClick={() => setModal({ open: false, converting: null, adding: false })}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Add New Lead</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal({ open: false, converting: null, adding: false })}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Name *</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Lead name" /></div>
              <div className="form-group"><label className="form-label">Mobile *</label><input className="form-input" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} placeholder="Mobile number" /></div>
              <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="What service are they interested in?" style={{ minHeight: 80 }} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal({ open: false, converting: null, adding: false })}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddLead}>Add Lead</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
