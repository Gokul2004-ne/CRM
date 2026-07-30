"use client";

import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState } from "react";
import { Collaboration } from "@/lib/types";
import { Plus, Search, Handshake, Phone, Mail, MessageCircle, Edit3, Trash2, ExternalLink } from "lucide-react";
import { getWhatsAppLink, formatDate } from "@/lib/utils";
import { toast } from "sonner";

const emptyCollaboration = (): Collaboration => ({
  id: "",
  name: "",
  number: "",
  email: "",
  type: "Business Partner",
  notes: "",
  createdAt: new Date().toISOString().split("T")[0],
});

export default function CollaborationsPage() {
  const { collaborations, addCollaboration, updateCollaboration, deleteCollaboration } = useAppStore();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ open: boolean; editing: boolean }>({ open: false, editing: false });
  const [form, setForm] = useState<Collaboration>(emptyCollaboration());

  const filtered = (collaborations || []).filter((c) => {
    const s = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(s) ||
      c.number.includes(search) ||
      c.email.toLowerCase().includes(s) ||
      (c.type && c.type.toLowerCase().includes(s))
    );
  });

  const handleOpenAdd = () => {
    setForm(emptyCollaboration());
    setModal({ open: true, editing: false });
  };

  const handleOpenEdit = (collab: Collaboration) => {
    setForm({ ...collab });
    setModal({ open: true, editing: true });
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.number.trim() || !form.email.trim()) {
      toast.error("Please fill in Name, Number, and Email ID fields.");
      return;
    }

    if (modal.editing) {
      updateCollaboration(form);
      toast.success("Collaboration details updated successfully!");
    } else {
      const newCollab: Collaboration = {
        ...form,
        id: `collab_${Date.now()}`,
        createdAt: new Date().toISOString().split("T")[0],
      };
      addCollaboration(newCollab);
      toast.success("New Collaboration created successfully!");
    }

    setModal({ open: false, editing: false });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete collaboration with "${name}"?`)) {
      deleteCollaboration(id);
      toast.success("Collaboration deleted.");
    }
  };

  return (
    <AppShell title="Co-laborations & Strategic Partners" subtitle="Manage external agency partnerships, business collaborations, and joint ventures">
      {/* Salesforce Page Banner */}
      <div className="page-header-slds">
        <div>
          <div className="breadcrumb">
            <span>zpluscrm</span>
            <span>/</span>
            <span className="current">Co-laborations</span>
          </div>
          <div className="page-title-slds">Co-laborations Directory</div>
          <div className="page-subtitle-slds">
            Organize business partnerships, manage contact info (Name, Phone Number, Email ID), and initiate direct communication.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-slds btn-slds-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>Add New Collaboration</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview Bar */}
      <div className="stat-grid-slds" style={{ marginBottom: 20 }}>
        <div className="kpi-card-slds">
          <div className="kpi-header">
            <span className="kpi-title">Total Collaborations</span>
            <div className="kpi-icon-wrapper blue">
              <Handshake size={20} />
            </div>
          </div>
          <div className="kpi-value">{collaborations?.length || 0}</div>
          <div className="kpi-trend up">Active strategic partners</div>
        </div>

        <div className="kpi-card-slds">
          <div className="kpi-header">
            <span className="kpi-title">Direct WhatsApp Reach</span>
            <div className="kpi-icon-wrapper emerald">
              <Phone size={20} />
            </div>
          </div>
          <div className="kpi-value">
            {collaborations?.filter((c) => c.number.length >= 10).length || 0}
          </div>
          <div className="kpi-trend up">Verified phone numbers</div>
        </div>

        <div className="kpi-card-slds">
          <div className="kpi-header">
            <span className="kpi-title">Email Contact Channels</span>
            <div className="kpi-icon-wrapper purple">
              <Mail size={20} />
            </div>
          </div>
          <div className="kpi-value">
            {collaborations?.filter((c) => c.email.includes("@")).length || 0}
          </div>
          <div className="kpi-trend up">Active email addresses</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card-slds">
        <div className="table-toolbar-slds">
          <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
            <Handshake size={18} color="#0176D3" />
            <span>Partner Directory ({filtered.length})</span>
          </div>

          <div className="search-input-wrapper">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search by Name, Number, or Email ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrapper-slds">
          <table className="table-slds">
            <thead>
              <tr>
                <th style={{ width: 60, textAlign: "center" }}>S.No.</th>
                <th>Partner Name</th>
                <th>Phone Number</th>
                <th>Email ID</th>
                <th>Category / Type</th>
                <th>Notes</th>
                <th>Date Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((collab, index) => (
                  <tr key={collab.id}>
                    <td style={{ fontWeight: 700, color: "#64748B", textAlign: "center", fontSize: 13 }}>
                      {index + 1}
                    </td>
                    <td style={{ fontWeight: 700, color: "#0F172A" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #0176D3 0%, #00A88F 100%)",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: 13,
                          }}
                        >
                          {collab.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div>{collab.name}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#0176D3", fontWeight: 600 }}>
                        <Phone size={13} />
                        <span>{collab.number}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569" }}>
                        <Mail size={13} color="#64748B" />
                        <a href={`mailto:${collab.email}`} style={{ color: "#2563EB", textDecoration: "none" }}>
                          {collab.email}
                        </a>
                      </div>
                    </td>
                    <td>
                      <span className="badge-slds badge-new" style={{ background: "#EEF2FF", color: "#4338CA", border: "1px solid #C7D2FE" }}>
                        {collab.type || "Business Partner"}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: "#64748B", maxWidth: 220 }}>
                      {collab.notes || "—"}
                    </td>
                    <td style={{ fontSize: 12, color: "#64748B" }}>
                      {collab.createdAt ? formatDate(collab.createdAt) : "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {collab.number && (
                          <a
                            href={getWhatsAppLink(collab.number, `Hello ${collab.name}, reaching out regarding our collaboration.`)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-slds btn-slds-success"
                            style={{ padding: "4px 8px", fontSize: 11 }}
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle size={13} />
                            <span>WhatsApp</span>
                          </a>
                        )}
                        <button
                          className="btn-slds btn-slds-secondary"
                          style={{ padding: "4px 8px" }}
                          onClick={() => handleOpenEdit(collab)}
                          title="Edit Collaboration"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          className="btn-slds btn-slds-secondary"
                          style={{ padding: "4px 8px", color: "#DC2626" }}
                          onClick={() => handleDelete(collab.id, collab.name)}
                          title="Delete Collaboration"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 32, color: "#64748B" }}>
                    No collaborations found. Click "Add New Collaboration" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add/Edit Collaboration */}
      {modal.open && (
        <div className="command-palette-backdrop" onClick={() => setModal({ open: false, editing: false })}>
          <div className="command-palette-card" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
                <Handshake size={20} color="#0176D3" />
                <span>{modal.editing ? "Edit Collaboration Details" : "Add New Co-laboration Partner"}</span>
              </div>
            </div>

            <div style={{ padding: 24, display: "grid", gap: 14 }}>
              {/* Section 1: Name */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                  Partner / Company Name *
                </label>
                <input
                  className="command-palette-input"
                  style={{ borderRadius: 8, border: "1px solid #CBD5E1", padding: 10, fontSize: 14 }}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Apex Tech Solutions"
                />
              </div>

              {/* Section 2: Number */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                  Phone / WhatsApp Number *
                </label>
                <input
                  className="command-palette-input"
                  style={{ borderRadius: 8, border: "1px solid #CBD5E1", padding: 10, fontSize: 14 }}
                  value={form.number}
                  onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
                  placeholder="e.g. 9876543210"
                />
              </div>

              {/* Section 3: Email ID */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                  Email ID *
                </label>
                <input
                  type="email"
                  className="command-palette-input"
                  style={{ borderRadius: 8, border: "1px solid #CBD5E1", padding: 10, fontSize: 14 }}
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="e.g. partner@apextech.com"
                />
              </div>

              {/* Category / Type */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                  Collaboration Category / Type
                </label>
                <input
                  className="command-palette-input"
                  style={{ borderRadius: 8, border: "1px solid #CBD5E1", padding: 10, fontSize: 14 }}
                  value={form.type || ""}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  placeholder="e.g. IT Vendor, Legal Advisory, Marketing Agency"
                />
              </div>

              {/* Notes */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                  Notes & Details
                </label>
                <textarea
                  className="command-palette-input"
                  style={{ borderRadius: 8, border: "1px solid #CBD5E1", padding: 10, fontSize: 14, minHeight: 70 }}
                  value={form.notes || ""}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. Joint agreement signed for joint project deliveries."
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  className="btn-slds btn-slds-secondary"
                  onClick={() => setModal({ open: false, editing: false })}
                >
                  Cancel
                </button>
                <button className="btn-slds btn-slds-primary" onClick={handleSave}>
                  {modal.editing ? "Update Collaboration" : "Create Collaboration"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
