"use client";
import { useState } from "react";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { Client } from "@/lib/types";
import {
  Users, Search, Plus, Filter, Edit, Trash2, Phone, Mail,
  Building, Copy, CheckCircle2, Shield
} from "lucide-react";
import { toast } from "sonner";

export default function ClientsPage() {
  const { clients, addClient, updateClient, deleteClient } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState<Partial<Client>>({
    name: "",
    type: "PROPRIETORSHIP",
    pan: "",
    gstin: "",
    contactPerson: "",
    phone: "",
    email: "",
    city: "",
    status: "ACTIVE"
  });

  const handleOpenAdd = () => {
    setEditingClient(null);
    setFormData({
      name: "",
      type: "PROPRIETORSHIP",
      pan: "",
      gstin: "",
      contactPerson: "",
      phone: "",
      email: "",
      city: "",
      status: "ACTIVE"
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormData(client);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error("Please fill in Client Name and Phone Number");
      return;
    }

    if (editingClient) {
      updateClient({ ...editingClient, ...formData } as Client);
      toast.success("Client details updated successfully!");
    } else {
      const newClient: Client = {
        id: `c_${Date.now()}`,
        name: formData.name || "",
        ownerName: formData.name || "",
        type: formData.type || "PROPRIETORSHIP",
        pan: formData.pan || "",
        gstin: formData.gstin || "",
        contactPerson: formData.contactPerson || "",
        phone: formData.phone || "",
        mobile: formData.phone || "",
        email: formData.email || "",
        city: formData.city || "",
        status: formData.status || "ACTIVE",
        createdAt: new Date().toISOString().split("T")[0]
      };
      addClient(newClient);
      toast.success("New Client added successfully!");
    }
    setIsModalOpen(false);
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.pan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.gstin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.phone || c.mobile || "").includes(searchQuery);
    const matchesFilter = filterType === "ALL" || c.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <AppShell title="Client Directory" subtitle="Manage client accounts, statutory details, and tax registrations">
      {/* Salesforce Page Banner */}
      <div className="page-header-slds">
        <div>
          <div className="breadcrumb">
            <span>Salesforce CRM</span>
            <span>/</span>
            <span className="current">Clients Directory</span>
          </div>
          <div className="page-title-slds">Clients Directory & Accounts</div>
          <div className="page-subtitle-slds">
            {clients.length} active client accounts registered under CA/CMA Firm practice.
          </div>
        </div>
        <button className="btn-slds btn-slds-primary" onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Zoho CRM Filter & Toolbar */}
      <div className="card-slds">
        <div className="table-toolbar-slds">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#64748B" }}>Entity Filter:</span>
            {["ALL", "PROPRIETORSHIP", "PARTNERSHIP", "PRIVATE_LIMITED", "INDIVIDUAL"].map((type) => (
              <button
                key={type}
                className={`btn-slds ${filterType === type ? "btn-slds-primary" : "btn-slds-secondary"}`}
                style={{ padding: "4px 10px", fontSize: 11 }}
                onClick={() => setFilterType(type)}
              >
                {type.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="search-input-wrapper">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search by name, PAN, GSTIN, or phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Clients Table */}
        <div className="table-wrapper-slds">
          <table className="table-slds">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Entity Type</th>
                <th>PAN / GSTIN</th>
                <th>Contact Info</th>
                <th>City</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 14 }}>{client.name}</div>
                      <div style={{ fontSize: 11, color: "#64748B" }}>Contact: {client.contactPerson || "N/A"}</div>
                    </td>
                    <td>
                      <span className="badge-slds badge-new">
                        {(client.type || "PROPRIETORSHIP").replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>PAN: {client.pan || "—"}</div>
                      <div style={{ fontSize: 11, color: "#64748B" }}>GST: {client.gstin || "—"}</div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#0F172A" }}>
                        <Phone size={13} color="#0176D3" />
                        <span>{client.phone}</span>
                      </div>
                      {client.email && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748B", marginTop: 2 }}>
                          <Mail size={12} />
                          <span>{client.email}</span>
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 500, color: "#475569" }}>
                      {client.city || "Mumbai"}
                    </td>
                    <td>
                      <span className={`badge-slds ${client.status === "ACTIVE" ? "badge-converted" : "badge-inactive"}`}>
                        {client.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="btn-slds btn-slds-secondary"
                          style={{ padding: "4px 8px", fontSize: 11 }}
                          onClick={() => handleOpenEdit(client)}
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          className="btn-slds btn-slds-secondary"
                          style={{ padding: "4px 8px", fontSize: 11, color: "#DC2626" }}
                          onClick={() => {
                            if (confirm(`Delete client ${client.name}?`)) {
                              deleteClient(client.id);
                              toast.success("Client deleted.");
                            }
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 28, color: "#64748B" }}>
                    No clients found matching the query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Client Modal */}
      {isModalOpen && (
        <div className="command-palette-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="command-palette-card" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0F172A" }}>
                {editingClient ? "Edit Client Details" : "Create New Client Account"}
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 24, display: "grid", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                  Client / Firm Name *
                </label>
                <input
                  type="text"
                  required
                  className="command-palette-input"
                  style={{ borderRadius: 8, border: "1px solid #CBD5E1", padding: 10, fontSize: 14 }}
                  placeholder="e.g. Acme Logistics Pvt Ltd"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                    Entity Type
                  </label>
                  <select
                    className="fy-selector-slds"
                    style={{ width: "100%", background: "white", color: "#0F172A", border: "1px solid #CBD5E1", padding: 10 }}
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                  >
                    <option value="PROPRIETORSHIP">Proprietorship</option>
                    <option value="PARTNERSHIP">Partnership</option>
                    <option value="PRIVATE_LIMITED">Private Limited</option>
                    <option value="LLP">LLP</option>
                    <option value="INDIVIDUAL">Individual</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    className="command-palette-input"
                    style={{ borderRadius: 8, border: "1px solid #CBD5E1", padding: 10, fontSize: 14 }}
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                    PAN Number
                  </label>
                  <input
                    type="text"
                    className="command-palette-input"
                    style={{ borderRadius: 8, border: "1px solid #CBD5E1", padding: 10, fontSize: 14 }}
                    placeholder="ABCDE1234F"
                    value={formData.pan}
                    onChange={e => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                    GSTIN
                  </label>
                  <input
                    type="text"
                    className="command-palette-input"
                    style={{ borderRadius: 8, border: "1px solid #CBD5E1", padding: 10, fontSize: 14 }}
                    placeholder="27ABCDE1234F1Z5"
                    value={formData.gstin}
                    onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn-slds btn-slds-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-slds btn-slds-primary">
                  {editingClient ? "Save Changes" : "Create Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
