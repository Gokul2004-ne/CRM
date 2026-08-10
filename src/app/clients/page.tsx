"use client";
import { useState } from "react";
import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { Client, ClientDocument, PortalCredential } from "@/lib/types";
import {
  Users, Search, Plus, Edit, Trash2, Phone, Mail,
  Building, Copy, CheckCircle2, Shield, Eye, Download, MessageCircle, FileText, Share2, Layers, Lock
} from "lucide-react";
import { getWhatsAppLink, formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Chandigarh"
];

export default function ClientsPage() {
  const { clients, services, subServices, requiredDocs, assignedServices, invoices, oneTimeServices, addClient, updateClient, deleteClient } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "credentials" | "documents" | "services" | "360">("details");

  const [formData, setFormData] = useState<Partial<Client>>({
    name: "",
    type: "PROPRIETORSHIP",
    pan: "",
    gstin: "",
    contactPerson: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    addressLine1: "",
    addressLine2: "",
    state: "Maharashtra",
    pincode: "",
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
      address: "",
      addressLine1: "",
      addressLine2: "",
      state: "Maharashtra",
      pincode: "",
      status: "ACTIVE"
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);

    let a1 = client.addressLine1 || "";
    let a2 = client.addressLine2 || "";
    let st = client.state || "Maharashtra";
    let pin = client.pincode || "";

    if (!a1 && client.address) {
      const parts = client.address.split(";").map(s => s.trim());
      if (parts.length >= 4) {
        a1 = parts[0];
        a2 = parts[1];
        st = parts[2];
        pin = parts[3];
      } else if (parts.length === 3) {
        a1 = parts[0];
        st = parts[1];
        pin = parts[2];
      } else if (parts.length === 2) {
        a1 = parts[0];
        st = parts[1];
      } else {
        a1 = client.address;
      }
    }

    setFormData({
      ...client,
      phone: client.phone || client.mobile || "",
      addressLine1: a1,
      addressLine2: a2,
      state: st,
      pincode: pin,
      documentCount: client.documentCount || client.documents?.length || 0
    });
    setIsModalOpen(true);
  };

  const handleOpenView = (client: Client) => {
    setViewingClient(client);
    setActiveTab("360");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const phoneVal = (formData.phone || formData.mobile || "").trim();
    const cleanPhone = phoneVal.replace(/\D/g, "");
    const emailVal = (formData.email || "").trim();

    if (!formData.name?.trim()) {
      toast.error("Please fill in Client / Firm Name");
      return;
    }

    if (!phoneVal) {
      toast.error("Please fill in Phone / Mobile Number");
      return;
    }

    // Strict 10-digit mobile number validation
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      toast.error("Invalid Mobile Number! Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).");
      return;
    }

    // Strict Email validation if provided
    if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      toast.error("Invalid Email Address! Please enter a valid email address (e.g. client@company.com).");
      return;
    }

    // Format address as: Address 1; Address 2; State; Pincode
    const addrParts = [
      formData.addressLine1?.trim(),
      formData.addressLine2?.trim(),
      formData.state?.trim(),
      formData.pincode?.trim()
    ].filter(Boolean);

    const formattedAddress = addrParts.join("; ");

    if (editingClient) {
      updateClient({
        ...editingClient,
        ...formData,
        name: formData.name.trim(),
        ownerName: formData.name.trim(),
        phone: phoneVal,
        mobile: phoneVal,
        email: emailVal,
        address: formattedAddress,
        documentCount: Number(formData.documentCount || 0)
      } as Client);
      toast.success("Client details updated successfully!");
    } else {
      const initialDocs: ClientDocument[] = [
        { id: `cd_${Date.now()}_1`, clientId: `c_${Date.now()}`, name: "Bank Statement Statement", type: "PDF", category: "Banking", uploadDate: new Date().toISOString().split("T")[0], status: "RECEIVED" },
        { id: `cd_${Date.now()}_2`, clientId: `c_${Date.now()}`, name: "GST / Sales Data Sheet", type: "XLSX", category: "Taxation", uploadDate: new Date().toISOString().split("T")[0], status: "VERIFIED" }
      ];

      const newClient: Client = {
        id: `c_${Date.now()}`,
        name: formData.name?.trim() || "",
        ownerName: formData.name?.trim() || "",
        type: formData.type || "PROPRIETORSHIP",
        pan: formData.pan || "",
        gstin: formData.gstin || "",
        contactPerson: formData.contactPerson || "",
        phone: phoneVal,
        mobile: phoneVal,
        email: emailVal,
        city: formData.city || "",
        address: formattedAddress,
        addressLine1: formData.addressLine1 || "",
        addressLine2: formData.addressLine2 || "",
        state: formData.state || "",
        pincode: formData.pincode || "",
        documentCount: Number(formData.documentCount || 2),
        documents: initialDocs,
        status: formData.status || "ACTIVE",
        createdAt: new Date().toISOString().split("T")[0]
      };
      addClient(newClient);
      toast.success("New Client account created successfully!");
    }
    setIsModalOpen(false);
  };

  const filteredClients = clients
    .filter(c => {
      const phoneVal = c.phone || c.mobile || "";
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (c.pan || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (c.gstin || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (c.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                            phoneVal.includes(searchQuery);
      const matchesFilter = filterType === "ALL" || c.type === filterType;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <AppShell title="Client Directory" subtitle="Manage client accounts, statutory details, documents, and sub-services">
      {/* Salesforce Page Banner */}
      <div className="page-header-slds">
        <div>
          <div className="breadcrumb">
            <span>zpluscrm</span>
            <span>/</span>
            <span className="current">Clients Directory</span>
          </div>
          <div className="page-title-slds">Clients Directory & Accounts</div>
          <div className="page-subtitle-slds">
            {clients.length} active client accounts registered with complete documents and compliance tracking.
          </div>
        </div>
        <button className="btn-slds btn-slds-primary" onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>Create New Client</span>
        </button>
      </div>

      {/* Zoho CRM Filter & Toolbar */}
      <div className="card-slds">
        <div className="table-toolbar-slds">
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#64748B" }}>Entity Filter:</span>
            {["ALL", "PROPRIETORSHIP", "PARTNERSHIP", "PRIVATE_LIMITED", "LLP", "HUF", "PUBLIC_LIMITED", "SECTION_8", "TRUST", "INDIVIDUAL"].map((type) => (
              <button
                key={type}
                className={`btn-slds ${filterType === type ? "btn-slds-primary" : "btn-slds-secondary"}`}
                style={{ padding: "4px 10px", fontSize: 11 }}
                onClick={() => setFilterType(type)}
              >
                {type.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          <div className="search-input-wrapper">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search by name, PAN, GSTIN, email, or phone..."
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
                <th style={{ width: 60, textAlign: "center" }}>S.No.</th>
                <th>Client Name</th>
                <th>Entity Type</th>
                <th>PAN / GSTIN</th>
                <th>Contact Info & Email</th>
                <th>Documents</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length > 0 ? (
                filteredClients.map((client, index) => {
                  const phoneNum = client.phone || client.mobile || "";
                  const docCount = client.documentCount || client.documents?.length || 0;

                  return (
                    <tr key={client.id}>
                      <td style={{ fontWeight: 700, color: "#64748B", textAlign: "center", fontSize: 13 }}>
                        {index + 1}
                      </td>
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
                          <span>{phoneNum}</span>
                        </div>
                        {client.email && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748B", marginTop: 2 }}>
                            <Mail size={12} color="#059669" />
                            <span>{client.email}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: 12, color: "#64748B" }}>
                          {client.city ? `📍 ${client.city}` : "—"}
                          {(client as any).address && <div style={{ fontSize: 11, marginTop: 2 }}>{(client as any).address}</div>}
                        </div>
                      </td>
                      <td>
                        <span className={`badge-slds ${client.status === "ACTIVE" ? "badge-converted" : "badge-inactive"}`}>
                          {client.status || "ACTIVE"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="btn-slds btn-slds-primary"
                            style={{ padding: "4px 10px", fontSize: 11 }}
                            onClick={() => handleOpenView(client)}
                            title="View Full Client Profile & Documents"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>
                          <a
                            href={getWhatsAppLink(phoneNum, `Hello ${client.name}, greetings from our office!`)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-slds btn-slds-success"
                            style={{ padding: "4px 10px", fontSize: 11 }}
                            title="Send WhatsApp Message"
                          >
                            <MessageCircle size={13} />
                            <span>WhatsApp</span>
                          </a>
                          <button
                            className="btn-slds btn-slds-secondary"
                            style={{ padding: "4px 8px", fontSize: 11 }}
                            onClick={() => handleOpenEdit(client)}
                            title="Edit Client"
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
                            title="Delete Client"
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
                  <td colSpan={8} style={{ textAlign: "center", padding: 28, color: "#64748B" }}>
                    No clients found matching the search query.
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
          <div className="command-palette-card" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0F172A" }}>
                {editingClient ? "Edit Client Details" : "Create New Client Account"}
              </div>
              <button className="btn-slds btn-slds-secondary" style={{ padding: "4px 8px" }} onClick={() => setIsModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 24, display: "grid", gap: 16, overflowY: "auto", maxHeight: "calc(85vh - 65px)" }}>
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
                    <option value="HUF">HUF</option>
                    <option value="PUBLIC_LIMITED">Public Limited</option>
                    <option value="SECTION_8">Section 8 Company</option>
                    <option value="TRUST">Trust / NGO</option>
                    <option value="INDIVIDUAL">Individual</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                    Phone / Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    className="command-palette-input"
                    style={{ borderRadius: 8, border: "1px solid #CBD5E1", padding: 10, fontSize: 14 }}
                    placeholder="e.g. 9876543210"
                    value={formData.phone || formData.mobile || ""}
                    onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, ""), mobile: e.target.value.replace(/\D/g, "") })}
                  />
                  <div style={{ fontSize: 10.5, color: "#64748B", marginTop: 2 }}>Must be valid 10-digit mobile number</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="command-palette-input"
                    style={{ borderRadius: 8, border: "1px solid #CBD5E1", padding: 10, fontSize: 14 }}
                    placeholder="client@company.com"
                    value={formData.email || ""}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>
                    City / Location
                  </label>
                  <input
                    type="text"
                    className="command-palette-input"
                    style={{ borderRadius: 8, border: "1px solid #CBD5E1", padding: 10, fontSize: 14 }}
                    placeholder="e.g. Bengaluru, Mumbai..."
                    value={formData.city || ""}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
              </div>

              {/* Structured Address Section */}
              <div style={{ background: "#F8FAFC", padding: 12, borderRadius: 10, border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.5px" }}>
                  Address Format (Saved as: Address 1; Address 2; State; Pincode)
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: "#475569", display: "block", marginBottom: 3 }}>
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      className="command-palette-input"
                      style={{ borderRadius: 8, border: "1px solid #CBD5E1", padding: 8, fontSize: 13, background: "white" }}
                      placeholder="e.g. Flat 101, Sai Residency"
                      value={formData.addressLine1 || ""}
                      onChange={e => setFormData({ ...formData, addressLine1: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: "#475569", display: "block", marginBottom: 3 }}>
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      className="command-palette-input"
                      style={{ borderRadius: 8, border: "1px solid #CBD5E1", padding: 8, fontSize: 13, background: "white" }}
                      placeholder="e.g. MG Road, Landmark"
                      value={formData.addressLine2 || ""}
                      onChange={e => setFormData({ ...formData, addressLine2: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: "#475569", display: "block", marginBottom: 3 }}>
                      State
                    </label>
                    <select
                      className="fy-selector-slds"
                      style={{ width: "100%", background: "white", color: "#0F172A", border: "1px solid #CBD5E1", padding: 8, fontSize: 13, borderRadius: 8 }}
                      value={formData.state || "Maharashtra"}
                      onChange={e => setFormData({ ...formData, state: e.target.value })}
                    >
                      {INDIAN_STATES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: "#475569", display: "block", marginBottom: 3 }}>
                      Pincode (6 digits)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      className="command-palette-input"
                      style={{ borderRadius: 8, border: "1px solid #CBD5E1", padding: 8, fontSize: 13, background: "white" }}
                      placeholder="e.g. 560001"
                      value={formData.pincode || ""}
                      onChange={e => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, "") })}
                    />
                  </div>
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
                    value={formData.pan || ""}
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
                    value={formData.gstin || ""}
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

      {/* Comprehensive Client View Modal (Section 1 & 7) */}
      {viewingClient && (
        <div className="command-palette-backdrop" onClick={() => setViewingClient(null)}>
          <div className="command-palette-card" style={{ maxWidth: 820 }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ padding: "20px 24px", background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", color: "white", borderRadius: "16px 16px 0 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: "#FFFFFF", margin: 0 }}>{viewingClient.name}</h2>
                    <span className="badge-slds badge-new" style={{ background: "#38BDF8", color: "#0F172A" }}>
                      {(viewingClient.type || "PROPRIETORSHIP").replace("_", " ")}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 4, display: "flex", gap: 16 }}>
                    <span>PAN: {viewingClient.pan || "N/A"}</span>
                    <span>•</span>
                    <span>GSTIN: {viewingClient.gstin || "N/A"}</span>
                    <span>•</span>
                    <span>City: {viewingClient.city || "Mumbai"}</span>
                  </div>
                </div>
                <button
                  className="btn-slds btn-slds-secondary"
                  style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "none" }}
                  onClick={() => setViewingClient(null)}
                >
                  ✕
                </button>
              </div>

              {/* Navigation Tabs */}
              <div style={{ display: "flex", gap: 6, marginTop: 20, borderBottom: "1px solid rgba(255,255,255,0.1)", flexWrap: "wrap" }}>
                {[
                  { id: "360", label: "📊 Client 360°", icon: Building },
                  { id: "details", label: "Profile & Details", icon: Building },
                  { id: "credentials", label: "Login Credentials", icon: Lock },
                  { id: "documents", label: `Documents (${viewingClient.documentCount || viewingClient.documents?.length || 0})`, icon: FileText },
                  { id: "services", label: "Services & Workflow", icon: Layers }
                ].map(t => (
                  <button
                    key={t.id}
                    className={`btn-slds`}
                    style={{
                      background: activeTab === t.id ? "white" : "transparent",
                      color: activeTab === t.id ? "#0F172A" : "#94A3B8",
                      borderRadius: "8px 8px 0 0",
                      padding: "8px 14px",
                      fontSize: 12,
                      fontWeight: 700
                    }}
                    onClick={() => setActiveTab(t.id as any)}
                  >
                    <t.icon size={13} />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24, maxHeight: 520, overflowY: "auto" }}>
              {/* ───── TAB 0: Client 360° Dashboard ───── */}
              {activeTab === "360" && (() => {
                const clientInvoices = (invoices || []).filter(inv => inv.clientId === viewingClient.id && inv.type === "INVOICE");
                const clientOts = (oneTimeServices || []).filter(ots => ots.clientName === viewingClient.name);
                const totalBilled360 = clientInvoices.reduce((s, inv) => s + (inv.total || 0), 0);
                const totalRecv360 = clientInvoices.reduce((s, inv) => s + (inv.amountReceived || 0), 0);
                const totalPend360 = clientInvoices.reduce((s, inv) => s + (inv.balanceDue || Math.max(0, (inv.total || 0) - (inv.amountReceived || 0))), 0);
                const recentInvoices = clientInvoices.slice(0, 3);
                const phone = viewingClient.phone || viewingClient.mobile || "";

                return (
                  <div style={{ display: "grid", gap: 16 }}>
                    {/* Quick Actions */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {phone && (
                        <a href={getWhatsAppLink(phone, `Hello ${viewingClient.name}, greetings from our office!`)} target="_blank" rel="noreferrer"
                          className="btn-slds btn-slds-success" style={{ padding: "7px 14px", fontSize: 12 }}>
                          <MessageCircle size={14} /> <span>WhatsApp</span>
                        </a>
                      )}
                      {viewingClient.email && (
                        <a href={`mailto:${viewingClient.email}`} className="btn-slds btn-slds-secondary" style={{ padding: "7px 14px", fontSize: 12, color: "#0284C7" }}>
                          <Mail size={14} /> <span>Email</span>
                        </a>
                      )}
                      {phone && (
                        <a href={`tel:${phone}`} className="btn-slds btn-slds-secondary" style={{ padding: "7px 14px", fontSize: 12 }}>
                          <Phone size={14} /> <span>Call</span>
                        </a>
                      )}
                    </div>

                    {/* Financial KPIs */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                      <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: 14, textAlign: "center" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", textTransform: "uppercase" }}>Total Billed</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: "#047857", marginTop: 4 }}>{formatCurrency(totalBilled360)}</div>
                        <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{clientInvoices.length} invoices</div>
                      </div>
                      <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: 14, textAlign: "center" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#1D4ED8", textTransform: "uppercase" }}>Collected</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: "#1D4ED8", marginTop: 4 }}>{formatCurrency(totalRecv360)}</div>
                        <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Amount received</div>
                      </div>
                      <div style={{ background: totalPend360 > 0 ? "#FEF2F2" : "#F0FDF4", border: `1px solid ${totalPend360 > 0 ? "#FECACA" : "#BBF7D0"}`, borderRadius: 12, padding: 14, textAlign: "center" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: totalPend360 > 0 ? "#DC2626" : "#059669", textTransform: "uppercase" }}>Pending</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: totalPend360 > 0 ? "#DC2626" : "#059669", marginTop: 4 }}>{formatCurrency(totalPend360)}</div>
                        <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Balance due</div>
                      </div>
                    </div>

                    {/* Recent Invoices */}
                    <div className="section-card" style={{ padding: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginBottom: 10 }}>Recent Invoices</div>
                      {recentInvoices.length > 0 ? (
                        <div style={{ display: "grid", gap: 8 }}>
                          {recentInvoices.map(inv => (
                            <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>#{inv.invoiceNumber}</div>
                                <div style={{ fontSize: 11, color: "#64748B" }}>{inv.date}</div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontWeight: 700, color: "#059669" }}>{formatCurrency(inv.total || 0)}</div>
                                <div style={{ fontSize: 11, color: inv.status === "PAID" ? "#059669" : "#D97706" }}>{inv.status}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: "#94A3B8", fontSize: 12, textAlign: "center", padding: "12px 0" }}>No invoices yet for this client</div>
                      )}
                    </div>

                    {/* One-Time Services */}
                    <div className="section-card" style={{ padding: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginBottom: 10 }}>One-Time Services ({clientOts.length})</div>
                      {clientOts.length > 0 ? (
                        <div style={{ display: "grid", gap: 6 }}>
                          {clientOts.map(ots => (
                            <div key={ots.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 12px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                              <div style={{ fontWeight: 700, fontSize: 12, color: "#4F46E5" }}>{ots.serviceName}</div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {ots.dueDate && <div style={{ fontSize: 11, color: "#64748B" }}>{formatDate(ots.dueDate)}</div>}
                                <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700,
                                  background: ots.progress === "Completed" ? "#F0FDF4" : ots.progress === "In-progress" ? "#FFFBEB" : "#F1F5F9",
                                  color: ots.progress === "Completed" ? "#059669" : ots.progress === "In-progress" ? "#D97706" : "#475569" }}>
                                  {ots.progress}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: "#94A3B8", fontSize: 12, textAlign: "center", padding: "12px 0" }}>No one-time services for this client</div>
                      )}
                    </div>

                    {/* Active Packages */}
                    <div className="section-card" style={{ padding: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginBottom: 10 }}>Active Packages ({assignedServices.filter(a => a.clientId === viewingClient.id).length})</div>
                      {assignedServices.filter(a => a.clientId === viewingClient.id).length > 0 ? (
                        <div style={{ display: "grid", gap: 6 }}>
                          {assignedServices.filter(a => a.clientId === viewingClient.id).slice(0, 4).map(a => {
                            const svc = services.find(s => s.id === a.serviceId);
                            return (
                              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 12px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                                <div style={{ fontWeight: 700, fontSize: 12, color: "#0F172A" }}>{svc?.name || "Package"}</div>
                                <div style={{ fontSize: 11, color: "#64748B" }}>FY {a.financialYear}</div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ color: "#94A3B8", fontSize: 12, textAlign: "center", padding: "12px 0" }}>No packages assigned</div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* TAB 1: Client Profile Details */}
              {activeTab === "details" && (
                <div style={{ display: "grid", gap: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div className="section-card" style={{ padding: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Primary Contact</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginTop: 4 }}>{viewingClient.contactPerson || viewingClient.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 13, color: "#0176D3", fontWeight: 600 }}>
                        <Phone size={14} />
                        <span>{viewingClient.phone || viewingClient.mobile}</span>
                      </div>
                      {viewingClient.email && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, fontSize: 13, color: "#059669" }}>
                          <Mail size={14} />
                          <span>{viewingClient.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="section-card" style={{ padding: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Statutory Identifiers</div>
                      <div style={{ marginTop: 6, fontSize: 13 }}>
                        <span style={{ color: "#64748B" }}>PAN Number:</span> <strong style={{ color: "#0F172A" }}>{viewingClient.pan || "N/A"}</strong>
                      </div>
                      <div style={{ marginTop: 4, fontSize: 13 }}>
                        <span style={{ color: "#64748B" }}>GSTIN Registration:</span> <strong style={{ color: "#0F172A" }}>{viewingClient.gstin || "N/A"}</strong>
                      </div>
                      <div style={{ marginTop: 4, fontSize: 13 }}>
                        <span style={{ color: "#64748B" }}>Total Uploaded Documents:</span> <strong style={{ color: "#059669" }}>{viewingClient.documentCount || viewingClient.documents?.length || 0} Docs</strong>
                      </div>
                    </div>
                  </div>

                  <div className="section-card" style={{ padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Office Address & Location</div>
                    <div style={{ fontSize: 13, color: "#334155", marginTop: 6 }}>
                      {viewingClient.address || `${viewingClient.city || "Mumbai"}, Maharashtra, India`}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Login Credentials */}
              {activeTab === "credentials" && (
                <div style={{ display: "grid", gap: 16 }}>
                  {/* Login Credentials Section (Multi-Portal: GST, Income Tax, MCA, Traces, E-Way Bill) */}
                  <div className="section-card" style={{ padding: 16, background: "#F0FDF4", borderColor: "#BBF7D0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#166534", display: "flex", alignItems: "center", gap: 6 }}>
                        🔐 Login Credentials
                      </div>
                      <button
                        className="btn-slds btn-slds-primary"
                        style={{ padding: "4px 10px", fontSize: 11 }}
                        onClick={() => {
                          const pName = prompt("Enter Portal Name (e.g. GST Portal, Income Tax Portal, MCA Portal):", "GST Portal");
                          if (!pName) return;
                          const pId = prompt(`Enter User ID / Username for ${pName}:`);
                          if (!pId) return;
                          const pPass = prompt(`Enter Password for ${pName}:`);
                          if (!pPass) return;

                          const newCred: PortalCredential = {
                            id: `cred_${Date.now()}`,
                            portalName: pName,
                            portalId: pId,
                            password: pPass
                          };

                          const existingCreds = viewingClient.portalCredentials || [
                            { id: "c1", portalName: "GST Portal", portalId: viewingClient.gstPortalId || "N/A", password: viewingClient.gstPortalPassword || "••••••••" }
                          ];
                          const updatedCreds = [...existingCreds, newCred];
                          const updatedClient = { ...viewingClient, portalCredentials: updatedCreds, gstPortalId: pId, gstPortalPassword: pPass };
                          updateClient(updatedClient);
                          setViewingClient(updatedClient);
                          toast.success(`Login credentials added for ${pName}!`);
                        }}
                      >
                        <Plus size={12} /> Add Login Credential
                      </button>
                    </div>

                    {/* Table of Portal Credentials */}
                    <div style={{ background: "white", borderRadius: 8, overflow: "hidden", border: "1px solid #BBF7D0" }}>
                      <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "#DCFCE7", color: "#166534", textTransform: "uppercase", fontSize: 10, fontWeight: 700 }}>
                            <th style={{ padding: "8px 12px", textAlign: "left" }}>Portal Name</th>
                            <th style={{ padding: "8px 12px", textAlign: "left" }}>User ID / Username</th>
                            <th style={{ padding: "8px 12px", textAlign: "left" }}>Password</th>
                            <th style={{ padding: "8px 12px", textAlign: "center" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {((viewingClient.portalCredentials && viewingClient.portalCredentials.length > 0)
                            ? viewingClient.portalCredentials
                            : [
                                { id: "c1", portalName: "GST Portal", portalId: viewingClient.gstPortalId || "Not Set", password: viewingClient.gstPortalPassword || "Not Set" },
                                { id: "c2", portalName: "Income Tax Portal", portalId: viewingClient.pan ? `${viewingClient.pan}` : "Not Set", password: "••••••••" }
                              ]
                          ).map((cred) => (
                            <tr key={cred.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                              <td style={{ padding: "8px 12px", fontWeight: 700, color: "#0F172A" }}>
                                🌐 {cred.portalName}
                              </td>
                              <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#1E293B", fontWeight: 600 }}>
                                {cred.portalId}
                                <button
                                  type="button"
                                  style={{ background: "none", border: "none", cursor: "pointer", marginLeft: 6, color: "#0176D3" }}
                                  onClick={() => { navigator.clipboard.writeText(cred.portalId); toast.success(`Copied User ID for ${cred.portalName}`); }}
                                  title="Copy User ID"
                                >
                                  📋
                                </button>
                              </td>
                              <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#1E293B", fontWeight: 600 }}>
                                {cred.password}
                                <button
                                  type="button"
                                  style={{ background: "none", border: "none", cursor: "pointer", marginLeft: 6, color: "#0176D3" }}
                                  onClick={() => { navigator.clipboard.writeText(cred.password); toast.success(`Copied Password for ${cred.portalName}`); }}
                                  title="Copy Password"
                                >
                                  📋
                                </button>
                              </td>
                              <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                <button
                                  className="btn-slds btn-slds-secondary"
                                  style={{ padding: "3px 6px", fontSize: 10, color: "#DC2626", borderColor: "#FCA5A5" }}
                                  onClick={() => {
                                    if (confirm(`Remove login credentials for ${cred.portalName}?`)) {
                                      const updatedCreds = (viewingClient.portalCredentials || []).filter(c => c.id !== cred.id);
                                      const updated = { ...viewingClient, portalCredentials: updatedCreds };
                                      updateClient(updated);
                                      setViewingClient(updated);
                                      toast.success("Credential removed.");
                                    }
                                  }}
                                >
                                  <Trash2 size={11} /> Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* WhatsApp Direct Action Bar */}
                  <div style={{ marginTop: 12, padding: "14px 18px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#166534", display: "flex", alignItems: "center", gap: 6 }}>
                        <MessageCircle size={16} />
                        <span>WhatsApp Client Channel</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#15803D", marginTop: 2 }}>
                        Send document requirements (sales data, HSN codes, login keys) and due date alerts directly to WhatsApp.
                      </div>
                    </div>
                    <a
                      href={getWhatsAppLink(viewingClient.phone || viewingClient.mobile, `Hello ${viewingClient.name}, here is an update regarding your compliance documents.`)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-slds btn-slds-success"
                      style={{ padding: "6px 14px", fontSize: 12 }}
                    >
                      <MessageCircle size={14} />
                      <span>Send WhatsApp Notice</span>
                    </a>
                  </div>
                </div>
              )}

              {/* TAB 2: Documents Workspace (Section 1 & Section 2) */}
              {activeTab === "documents" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 14 }}>
                      Client Documents ({viewingClient.documents?.length || viewingClient.documentCount || 0})
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <label
                        className="btn-slds btn-slds-primary"
                        style={{ padding: "5px 12px", fontSize: 11, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        <Plus size={13} />
                        <span>Upload File</span>
                        <input
                          type="file"
                          style={{ display: "none" }}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const newDoc: ClientDocument = {
                                id: `cd_${Date.now()}`,
                                clientId: viewingClient.id,
                                name: file.name,
                                type: file.name.split(".").pop()?.toUpperCase() || "PDF",
                                category: "Taxation & Compliance",
                                uploadDate: new Date().toISOString().split("T")[0],
                                size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                                status: "RECEIVED"
                              };
                              const updatedDocs = [...(viewingClient.documents || []), newDoc];
                              const updated = { ...viewingClient, documents: updatedDocs, documentCount: updatedDocs.length };
                              updateClient(updated);
                              setViewingClient(updated);
                              toast.success(`Uploaded "${file.name}" to client profile!`);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="table-wrapper-slds">
                    <table className="table-slds">
                      <thead>
                        <tr>
                          <th>Document Title</th>
                          <th>Category</th>
                          <th>Upload Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(viewingClient.documents && viewingClient.documents.length > 0) ? (
                          viewingClient.documents.map((doc) => (
                            <tr key={doc.id}>
                              <td>
                                <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 13 }}>{doc.name}</div>
                                <div style={{ fontSize: 11, color: "#64748B" }}>{doc.type} • {doc.size || "1.2 MB"}</div>
                              </td>
                              <td>
                                <span className="chip" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
                                  {doc.category || "General"}
                                </span>
                              </td>
                              <td style={{ fontSize: 12, color: "#475569" }}>{formatDate(doc.uploadDate)}</td>
                              <td>
                                <span className={`badge-slds ${doc.status === "VERIFIED" ? "badge-converted" : "badge-pending"}`}>
                                  {doc.status || "RECEIVED"}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: 6 }}>
                                  {/* Download button with real file download blob */}
                                  <button
                                    className="btn-slds btn-slds-secondary"
                                    style={{ padding: "4px 8px", fontSize: 11 }}
                                    onClick={() => {
                                      if (doc.fileUrl) {
                                        const a = document.createElement("a");
                                        a.href = doc.fileUrl;
                                        a.download = doc.name;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                      } else {
                                        const dummyContent = `CLIENT STATUTORY & COMPLIANCE FILE\n=======================================\nDocument Name: ${doc.name}\nCategory: ${doc.category || "General"}\nUpload Date: ${doc.uploadDate}\nStatus: ${doc.status || "RECEIVED"}\nClient Name: ${viewingClient.name}\n\n[Official document file content demo]`;
                                        const mime = doc.type === "XLSX" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : doc.type === "PDF" ? "application/pdf" : "text/plain";
                                        const blob = new Blob([dummyContent], { type: mime });
                                        const blobUrl = URL.createObjectURL(blob);
                                        const a = document.createElement("a");
                                        a.href = blobUrl;
                                        const ext = doc.name.includes(".") ? "" : `.${(doc.type || "txt").toLowerCase()}`;
                                        a.download = `${doc.name}${ext}`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(blobUrl);
                                      }
                                      toast.success(`Successfully downloaded "${doc.name}"`);
                                    }}
                                    title="Download Document"
                                  >
                                    <Download size={13} />
                                    <span>Download</span>
                                  </button>
                                  {/* Share to WhatsApp button */}
                                  <a
                                    href={getWhatsAppLink(viewingClient.phone || viewingClient.mobile, `📄 Compliance Document Notice:\nClient: ${viewingClient.name}\nDocument: ${doc.name}\nCategory: ${doc.category || "General"}\nStatus: ${doc.status || "RECEIVED"}`)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn-slds btn-slds-success"
                                    style={{ padding: "4px 8px", fontSize: 11 }}
                                    title="Share Document via WhatsApp"
                                  >
                                    <Share2 size={13} />
                                    <span>WhatsApp</span>
                                  </a>
                                  {/* Delete document button */}
                                  <button
                                    className="btn-slds btn-slds-secondary"
                                    style={{ padding: "4px 6px", fontSize: 11, color: "#DC2626", borderColor: "#FCA5A5" }}
                                    onClick={() => {
                                      if (confirm(`Remove document ${doc.name}?`)) {
                                        const updatedDocs = (viewingClient.documents || []).filter(d => d.id !== doc.id);
                                        const updated = { ...viewingClient, documents: updatedDocs, documentCount: updatedDocs.length };
                                        updateClient(updated);
                                        setViewingClient(updated);
                                        toast.success("Document removed.");
                                      }
                                    }}
                                    title="Delete Document"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} style={{ textAlign: "center", padding: 24, color: "#64748B" }}>
                              No documents uploaded yet. Click "Add Document" to upload statutory files.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: Assigned Sub-Services & Actions Row (Section 7) */}
              {activeTab === "services" && (
                <div>
                  <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 14, marginBottom: 12 }}>
                  Services & Workflow Tasks for {viewingClient.name}
                  </div>

                  {assignedServices.filter(a => a.clientId === viewingClient.id).length > 0 ? (
                    assignedServices.filter(a => a.clientId === viewingClient.id).map(a => {
                      const parentService = services.find(s => s.id === a.serviceId);
                      const assignedSubs = subServices.filter(ss => a.subServiceIds.includes(ss.id));

                      return (
                        <div key={a.id} className="section-card" style={{ marginBottom: 14, padding: 16, border: "1px solid #E2E8F0", borderRadius: 12 }}>
                          {/* Main Service Header */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: "1px solid #F1F5F9" }}>
                            <div>
                              <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>{parentService?.name}</span>
                              <span className="badge-slds badge-new" style={{ marginLeft: 10 }}>FY {a.financialYear}</span>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: a.amountPending > 0 ? "#DC2626" : "#059669" }}>
                              Billed: {formatCurrency(a.amountBilled)} | Due: {a.dueDate ? formatDate(a.dueDate) : "N/A"}
                            </div>
                          </div>

                          {/* Sub-Services Table with Section 7 Layout Guidance */}
                          <div style={{ marginTop: 10 }}>
                            <table style={{ width: "100%", fontSize: 13 }}>
                              <thead>
                                <tr style={{ background: "#F8FAFC", textAlign: "left", color: "#64748B" }}>
                                  <th style={{ padding: "6px 10px" }}>Service</th>
                                  <th style={{ padding: "6px 10px" }}>Required Documents</th>
                                  <th style={{ padding: "6px 10px" }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {assignedSubs.map(ss => {
                                  const reqDocs = requiredDocs.filter(d => d.subServiceId === ss.id);

                                  return (
                                    <tr key={ss.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                      <td style={{ padding: "10px", fontWeight: 700, color: "#0F172A" }}>
                                        {ss.name}
                                      </td>
                                      <td style={{ padding: "10px" }}>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                          {reqDocs.map(d => (
                                            <span key={d.id} className="chip" style={{ background: "#F0FDF4", color: "#166534", fontSize: 11 }}>
                                              {d.name}
                                            </span>
                                          ))}
                                          {reqDocs.length === 0 && <span style={{ color: "#94A3B8", fontSize: 11 }}>No docs specified</span>}
                                        </div>
                                      </td>
                                      <td style={{ padding: "10px" }}>
                                        {/* Action Column Layout: View & Edit under Action column */}
                                        <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                                          <button
                                            className="btn-slds btn-slds-primary"
                                            style={{ padding: "3px 8px", fontSize: 11 }}
                                            onClick={() => toast.info(`Viewing ${ss.name} details`)}
                                          >
                                            <Eye size={12} />
                                            <span>View</span>
                                          </button>
                                          <button
                                            className="btn-slds btn-slds-secondary"
                                            style={{ padding: "3px 8px", fontSize: 11 }}
                                            onClick={() => toast.info(`Edit ${ss.name}`)}
                                          >
                                            <Edit size={12} />
                                            <span>Edit</span>
                                          </button>
                                        </div>

                                        {/* Layout Guidance: Dedicated NOTIFY ROW below Action buttons */}
                                        <div style={{ background: "#F8FAFC", padding: "4px 8px", borderRadius: 6, display: "flex", alignItems: "center", gap: 6, width: "fit-content" }}>
                                          <span style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Notify:</span>
                                          <a
                                            href={getWhatsAppLink(viewingClient.phone || viewingClient.mobile, `Reminder for ${ss.name} under ${parentService?.name}. Due Date: ${a.dueDate || "N/A"}`)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="btn-slds btn-slds-success"
                                            style={{ padding: "2px 6px", fontSize: 10 }}
                                            title="Send via WhatsApp"
                                          >
                                            <MessageCircle size={11} />
                                            <span>WhatsApp</span>
                                          </a>
                                          {viewingClient.email && (
                                            <a
                                              href={`mailto:${viewingClient.email}?subject=${encodeURIComponent(`Notice: ${ss.name}`)}&body=${encodeURIComponent(`Dear ${viewingClient.name},\n\nThis is a reminder regarding your sub-service: ${ss.name} under ${parentService?.name}.\nDue Date: ${a.dueDate || "N/A"}`)}`}
                                              className="btn-slds btn-slds-secondary"
                                              style={{ padding: "2px 6px", fontSize: 10, color: "#0284C7", borderColor: "#BAE6FD" }}
                                              title="Send via Email"
                                            >
                                              <Mail size={11} />
                                              <span>Mail</span>
                                            </a>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: 24, textAlign: "center", color: "#64748B" }}>
                       No services currently assigned to this client. Go to "Assign Packages" menu to assign packages and services.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "14px 24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end" }}>
              <button className="btn-slds btn-slds-secondary" onClick={() => setViewingClient(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

