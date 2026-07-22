"use client";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { formatDate, getWhatsAppLink } from "@/lib/utils";
import { Client } from "@/lib/types";
import { Plus, Search, Pencil, Trash2, MessageCircle, Phone, Mail, Building } from "lucide-react";
import { toast } from "sonner";

const emptyClient = (): Client => ({
  id: "", name: "", ownerName: "", referredBy: "", mobile: "", email: "",
  registrationNo: "", panNo: "", gstNo: "", incorporationDate: "", acquiredDate: "",
  address: "", notes: ""
});

export default function ClientsPage() {
  const { clients, addClient, updateClient, deleteClient } = useAppStore();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ open: boolean; editing: Client | null }>({ open: false, editing: null });
  const [form, setForm] = useState<Client>(emptyClient());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = useMemo(() =>
    clients.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.mobile.includes(search) ||
      c.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      (c.gstNo || "").toLowerCase().includes(search.toLowerCase())
    ), [clients, search]);

  const openAdd = () => { setForm(emptyClient()); setModal({ open: true, editing: null }); };
  const openEdit = (c: Client) => { setForm({ ...c }); setModal({ open: true, editing: c }); };

  const handleSave = () => {
    if (!form.name || !form.mobile) { toast.error("Name and mobile are required"); return; }
    if (modal.editing) {
      updateClient(form);
      toast.success("Client updated successfully");
    } else {
      addClient({ ...form, id: `c${Date.now()}` });
      toast.success("Client added successfully");
    }
    setModal({ open: false, editing: null });
  };

  const handleDelete = (id: string) => {
    deleteClient(id);
    setDeleteConfirm(null);
    toast.success("Client deleted");
  };

  const F = (k: keyof Client) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <AppShell title="Client Data" subtitle={`${clients.length} total clients`}>
      <div className="data-table-wrapper">
        <div className="data-table-header">
          <div className="search-wrapper">
            <Search className="search-icon" />
            <input className="search-input" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Client</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Client Name</th>
              <th>Owner Name</th>
              <th>Mobile</th>
              <th>Email</th>
              <th>GST No</th>
              <th>PAN No</th>
              <th>Reg No</th>
              <th>Acquired Date</th>
              <th>Referred By</th>
              <th>WhatsApp</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={12} style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>No clients found</td></tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id}>
                <td style={{ color: "#94A3B8", fontWeight: 600 }}>{i + 1}</td>
                <td>
                  <div style={{ fontWeight: 700, color: "#0F172A" }}>{c.name}</div>
                  {c.address && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{c.address}</div>}
                </td>
                <td>{c.ownerName}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Phone size={12} color="#94A3B8" /> {c.mobile}
                  </div>
                </td>
                <td>
                  {c.email && <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Mail size={12} color="#94A3B8" /> {c.email}
                  </div>}
                </td>
                <td><span style={{ fontFamily: "monospace", fontSize: 12 }}>{c.gstNo || "-"}</span></td>
                <td><span style={{ fontFamily: "monospace", fontSize: 12 }}>{c.panNo || "-"}</span></td>
                <td><span style={{ fontSize: 12 }}>{c.registrationNo || "-"}</span></td>
                <td>{c.acquiredDate ? formatDate(c.acquiredDate) : "-"}</td>
                <td>{c.referredBy || "-"}</td>
                <td>
                  <a href={getWhatsAppLink(c.mobile)} target="_blank" rel="noreferrer" className="wa-btn">
                    <MessageCircle size={13} />
                  </a>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(c)}><Pencil size={13} /></button>
                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => setDeleteConfirm(c.id)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: "10px 16px", fontSize: 12, color: "#94A3B8", borderTop: "1px solid #F1F5F9" }}>
          Showing {filtered.length} of {clients.length} clients
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal.open && (
        <div className="modal-overlay" onClick={() => setModal({ open: false, editing: null })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modal.editing ? "Edit Client" : "Add New Client"}</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal({ open: false, editing: null })}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid-2">
                <div className="form-group"><label className="form-label">Client Name *</label><input className="form-input" value={form.name} onChange={F("name")} placeholder="Company / Individual name" /></div>
                <div className="form-group"><label className="form-label">Owner Name *</label><input className="form-input" value={form.ownerName} onChange={F("ownerName")} placeholder="Proprietor / Director name" /></div>
                <div className="form-group"><label className="form-label">Mobile *</label><input className="form-input" value={form.mobile} onChange={F("mobile")} placeholder="10-digit mobile number" /></div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={F("email")} placeholder="Email address" /></div>
                <div className="form-group"><label className="form-label">GST Number</label><input className="form-input" value={form.gstNo} onChange={F("gstNo")} placeholder="15-digit GSTIN" /></div>
                <div className="form-group"><label className="form-label">PAN Number</label><input className="form-input" value={form.panNo} onChange={F("panNo")} placeholder="AAAAA0000A" /></div>
                <div className="form-group"><label className="form-label">Registration Number</label><input className="form-input" value={form.registrationNo} onChange={F("registrationNo")} placeholder="CIN / Registration No." /></div>
                <div className="form-group"><label className="form-label">Referred By</label><input className="form-input" value={form.referredBy} onChange={F("referredBy")} placeholder="Who referred this client?" /></div>
                <div className="form-group"><label className="form-label">Acquired Date</label><input className="form-input" type="date" value={form.acquiredDate} onChange={F("acquiredDate")} /></div>
                <div className="form-group"><label className="form-label">Incorporation Date</label><input className="form-input" type="date" value={form.incorporationDate} onChange={F("incorporationDate")} /></div>
              </div>
              <div className="form-group"><label className="form-label">Address</label><input className="form-input" value={form.address} onChange={F("address")} placeholder="Full address" /></div>
              <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={F("notes")} placeholder="Additional notes..." /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal({ open: false, editing: null })}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>{modal.editing ? "Save Changes" : "Add Client"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header"><div className="modal-title">Delete Client?</div></div>
            <div className="modal-body"><p style={{ color: "#64748B", fontSize: 14 }}>This will permanently delete the client and all associated data. This action cannot be undone.</p></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
