"use client";
import AppShell from "@/components/AppShell";
import { useState } from "react";
import { Save, Building2, User, Bell, Shield, Palette } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [tab, setTab] = useState("firm");
  const [firmName, setFirmName] = useState("CRMExpert Advisory LLP");
  const [ownerName, setOwnerName] = useState("CA Gokulnath");
  const [email, setEmail] = useState("info@crmexpert.in");
  const [mobile, setMobile] = useState("9876543210");
  const [address, setAddress] = useState("Mumbai, Maharashtra");
  const [fyStart, setFyStart] = useState("4");
  const [currency, setCurrency] = useState("INR");
  const [primaryColor, setPrimaryColor] = useState("#0176D3");

  const handleSave = () => toast.success("Settings saved successfully!");

  return (
    <AppShell title="Settings" subtitle="Configure your CRMExpert workspace">
      <div style={{ display: "flex", gap: 20 }}>
        {/* Sidebar Tabs */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <div className="section-card" style={{ padding: 8 }}>
            {[
              { id: "firm", label: "Firm Details", icon: Building2 },
              { id: "profile", label: "Profile", icon: User },
              { id: "preferences", label: "Preferences", icon: Palette },
              { id: "notifications", label: "Notifications", icon: Bell },
              { id: "security", label: "Security", icon: Shield },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`nav-item ${tab === id ? "active" : ""}`}
                style={{ color: tab === id ? "#E8520A" : "#64748B", background: tab === id ? "#FFF0E8" : "transparent", margin: "2px 0", width: "100%" }}>
                <Icon size={16} /><span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          {tab === "firm" && (
            <div className="section-card">
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, color: "#0F172A" }}>Firm Details</div>
              <div className="form-grid-2">
                <div className="form-group"><label className="form-label">Firm / Practice Name</label><input className="form-input" value={firmName} onChange={e => setFirmName(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Owner / Proprietor Name</label><input className="form-input" value={ownerName} onChange={e => setOwnerName(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Email Address</label><input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Mobile Number</label><input className="form-input" value={mobile} onChange={e => setMobile(e.target.value)} /></div>
              </div>
              <div className="form-group"><label className="form-label">Office Address</label><textarea className="form-textarea" value={address} onChange={e => setAddress(e.target.value)} style={{ minHeight: 80 }} /></div>
              <div className="form-grid-2">
                <div className="form-group"><label className="form-label">Financial Year Start Month</label>
                  <select className="form-select" value={fyStart} onChange={e => setFyStart(e.target.value)}>
                    {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                      <option key={i} value={String(i+1)}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Currency</label>
                  <select className="form-select" value={currency} onChange={e => setCurrency(e.target.value)}>
                    <option value="INR">INR — Indian Rupee (₹)</option>
                    <option value="USD">USD — US Dollar ($)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <button className="btn btn-primary" onClick={handleSave}><Save size={14} /> Save Firm Details</button>
              </div>
            </div>
          )}

          {tab === "preferences" && (
            <div className="section-card">
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, color: "#0F172A" }}>Preferences</div>
              <div className="form-group">
                <label className="form-label">Primary Brand Color</label>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 6 }}>
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ width: 48, height: 40, cursor: "pointer", borderRadius: 8, border: "none", padding: 2 }} />
                  <span style={{ fontSize: 13, color: "#64748B" }}>{primaryColor}</span>
                  {["#E8520A","#1A237E","#059669","#7C3AED","#DC2626"].map(c => (
                    <div key={c} onClick={() => setPrimaryColor(c)} style={{ width: 32, height: 32, borderRadius: "50%", background: c, cursor: "pointer", border: primaryColor === c ? "3px solid #0F172A" : "none", transition: "all 0.15s" }} />
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <button className="btn btn-primary" onClick={handleSave}><Save size={14} /> Save Preferences</button>
              </div>
            </div>
          )}

          {tab === "notifications" && (
            <div className="section-card">
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, color: "#0F172A" }}>Notification Settings</div>
              {[
                { label: "Due date reminders (7 days before)", desc: "Get notified when a service is due in 7 days" },
                { label: "Overdue alerts", desc: "Get notified when a service is overdue" },
                { label: "Payment received", desc: "Notification when amount is marked as received" },
                { label: "New lead from WhatsApp", desc: "Alert when a new WhatsApp message comes in" },
              ].map((n, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #F1F5F9" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 14 }}>{n.label}</div>
                    <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{n.desc}</div>
                  </div>
                  <label style={{ position: "relative", width: 44, height: 24, cursor: "pointer" }}>
                    <input type="checkbox" defaultChecked style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: "absolute", inset: 0, background: "#E8520A", borderRadius: 24, transition: "0.2s" }} />
                    <span style={{ position: "absolute", left: 2, top: 2, width: 20, height: 20, background: "white", borderRadius: "50%", transition: "0.2s", transform: "translateX(20px)" }} />
                  </label>
                </div>
              ))}
            </div>
          )}

          {(tab === "profile" || tab === "security") && (
            <div className="section-card">
              <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{tab === "profile" ? "👤" : "🔒"}</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>
                  {tab === "profile" ? "Profile settings" : "Security settings"} will be available after connecting authentication.
                </div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Currently using local mode.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
