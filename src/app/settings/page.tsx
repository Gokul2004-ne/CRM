"use client";
import AppShell from "@/components/AppShell";
import { useEffect, useState } from "react";
import { Save, Building2, User, Bell, Shield, Palette, CreditCard, Database, Download, Trash2, KeyRound, LogOut, CheckCircle, Eye, EyeOff, RefreshCw, PenTool, UploadCloud, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useAppStore, purgeUserLocalData } from "@/lib/store";
import { syncUserSettingsToSupabase, purgeAllUserDataFromSupabase } from "@/lib/supabaseData";

const SETTINGS_KEY = "zpluscrm_settings";

function loadSettings() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"); } catch { return {}; }
}
function saveSettings(data: any) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
    syncUserSettingsToSupabase(data);
  } catch {}
}

// Toggle Switch Component
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ position: "relative", width: 44, height: 24, cursor: "pointer", display: "inline-block", flexShrink: 0 }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
      <span style={{ position: "absolute", inset: 0, background: checked ? "#E8520A" : "#CBD5E1", borderRadius: 24, transition: "0.2s" }} />
      <span style={{ position: "absolute", left: checked ? 22 : 2, top: 2, width: 20, height: 20, background: "white", borderRadius: "50%", transition: "0.2s" }} />
    </label>
  );
}

export default function SettingsPage() {
  const { user, updatePassword, signOut } = useAuth();
  const [tab, setTab] = useState("firm");

  const clients = useAppStore(state => state.clients);
  const invoices = useAppStore(state => state.invoices);

  // ─── Firm Details ─────────────────────────────────────────────────────────
  const [firmName, setFirmName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [regNo, setRegNo] = useState("");
  const [website, setWebsite] = useState("");
  const [fyStart, setFyStart] = useState("4");
  const [currency, setCurrency] = useState("INR");
  const [signatureUrl, setSignatureUrl] = useState("");

  // ─── Profile ──────────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState("");
  const [designation, setDesignation] = useState("");
  const [bio, setBio] = useState("");

  // ─── Preferences ─────────────────────────────────────────────────────────
  const [primaryColor, setPrimaryColor] = useState("#E8520A");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [layoutDensity, setLayoutDensity] = useState("comfortable");

  // ─── Notifications ────────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState({
    dueDate7: true, overdue: true, paymentReceived: true, newLead: true,
    invoiceCreated: false, weeklyReport: false,
  });

  // ─── Security ────────────────────────────────────────────────────────────
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwds, setShowPwds] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  // ─── Load/Save from localStorage ─────────────────────────────────────────
  useEffect(() => {
    const s = loadSettings();
    if (s.firmName) setFirmName(s.firmName);
    if (s.ownerName) setOwnerName(s.ownerName);
    if (s.email) setEmail(s.email);
    if (s.mobile) setMobile(s.mobile);
    if (s.address) setAddress(s.address);
    if (s.gstin) setGstin(s.gstin);
    if (s.pan) setPan(s.pan);
    if (s.regNo) setRegNo(s.regNo);
    if (s.website) setWebsite(s.website);
    if (s.fyStart) setFyStart(s.fyStart);
    if (s.currency) setCurrency(s.currency);
    if (s.signatureUrl) setSignatureUrl(s.signatureUrl);
    if (s.fullName) setFullName(s.fullName);
    if (s.designation) setDesignation(s.designation);
    if (s.bio) setBio(s.bio);
    if (s.primaryColor) {
      setPrimaryColor(s.primaryColor);
      if (typeof document !== "undefined") {
        document.documentElement.style.setProperty("--primary-color", s.primaryColor);
      }
    }
    if (s.dateFormat) setDateFormat(s.dateFormat);
    if (s.layoutDensity) setLayoutDensity(s.layoutDensity);
    if (s.notifs) setNotifs(prev => ({ ...prev, ...s.notifs }));
  }, []);

  const handleSignatureUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, SVG)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setSignatureUrl(result);
        toast.success("Signature uploaded! Click 'Save Firm Details' to persist.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveFirm = () => {
    saveSettings({ ...loadSettings(), firmName, ownerName, email, mobile, address, gstin, pan, regNo, website, fyStart, currency, signatureUrl });
    toast.success("Firm details & signature saved!");
  };
  const handleSaveProfile = () => {
    saveSettings({ ...loadSettings(), fullName, designation, bio });
    toast.success("Profile details saved!");
  };
  const handleSavePreferences = () => {
    saveSettings({ ...loadSettings(), primaryColor, dateFormat, layoutDensity });
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--primary-color", primaryColor);
    }
    toast.success("Preferences saved successfully!");
  };
  const handleSaveNotifs = () => {
    saveSettings({ ...loadSettings(), notifs });
    toast.success("Notification settings saved!");
  };

  const handleChangePassword = async () => {
    if (!newPwd || !confirmPwd) { toast.error("Please fill all password fields"); return; }
    if (newPwd !== confirmPwd) { toast.error("New passwords do not match"); return; }
    if (newPwd.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setChangingPwd(true);
    try {
      const { error } = await updatePassword(newPwd);
      if (error) { toast.error(error.message || "Failed to change password"); }
      else { toast.success("Password changed successfully!"); setCurrentPwd(""); setNewPwd(""); setConfirmPwd(""); }
    } finally { setChangingPwd(false); }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
  };

  // ─── Export CSV Handlers ──────────────────────────────────────────────────
  const exportClientsCSV = () => {
    const storeClients = useAppStore.getState().clients || [];
    let rows = [...storeClients];

    if (!rows || rows.length === 0) {
      try {
        if (typeof window !== "undefined") {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.endsWith("_clients")) {
              const parsed = JSON.parse(localStorage.getItem(key) || "[]");
              if (Array.isArray(parsed) && parsed.length > 0) {
                rows = parsed;
                break;
              }
            }
          }
        }
      } catch {}
    }

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const clean = String(val).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const headers = [
      "Client ID", "Client Name", "Owner / Contact Person", "Mobile", "Phone",
      "Email", "PAN", "GSTIN", "GST Portal User ID", "City", "State",
      "Registration No", "Status", "Incorporation Date", "Address", "Created At"
    ];

    let csvContent = headers.join(",") + "\n";

    if (rows && rows.length > 0) {
      const dataLines = rows.map((r: any) => {
        const fullAddr = [r.address, r.addressLine1, r.addressLine2, r.city, r.state, r.pincode].filter(Boolean).join(", ");
        return [
          escapeCSV(r.id),
          escapeCSV(r.name),
          escapeCSV(r.contactPerson || r.ownerName),
          escapeCSV(r.mobile),
          escapeCSV(r.phone),
          escapeCSV(r.email),
          escapeCSV(r.pan || r.panNo),
          escapeCSV(r.gstin || r.gstNo),
          escapeCSV(r.gstPortalId),
          escapeCSV(r.city),
          escapeCSV(r.state),
          escapeCSV(r.registrationNo),
          escapeCSV(r.status || "Active"),
          escapeCSV(r.incorporationDate),
          escapeCSV(fullAddr),
          escapeCSV(r.createdAt)
        ].join(",");
      });
      csvContent += dataLines.join("\n");
      toast.success(`Exported ${rows.length} client(s) to CSV file!`);
    } else {
      toast.info("No client records in database. Downloaded client CSV template.");
    }

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `clients_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportInvoicesCSV = () => {
    const storeInvoices = useAppStore.getState().invoices || [];
    let rows = [...storeInvoices];

    if (!rows || rows.length === 0) {
      try {
        if (typeof window !== "undefined") {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.endsWith("_invoices")) {
              const parsed = JSON.parse(localStorage.getItem(key) || "[]");
              if (Array.isArray(parsed) && parsed.length > 0) {
                rows = parsed;
                break;
              }
            }
          }
        }
      } catch {}
    }

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const clean = String(val).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const headers = [
      "Invoice Number", "Type", "Client Name", "Date", "Financial Year",
      "Subtotal (INR)", "GST Rate (%)", "GST Amount (INR)", "Total Amount (INR)",
      "Amount Received (INR)", "Balance Due (INR)", "Status", "Notes", "Created At"
    ];

    let csvContent = headers.join(",") + "\n";

    if (rows && rows.length > 0) {
      const dataLines = rows.map((r: any) => {
        return [
          escapeCSV(r.invoiceNumber),
          escapeCSV(r.type || "INVOICE"),
          escapeCSV(r.clientName),
          escapeCSV(r.date),
          escapeCSV(r.financialYear),
          escapeCSV(r.subtotal || 0),
          escapeCSV(r.gstRate || 0),
          escapeCSV(r.gstAmount || 0),
          escapeCSV(r.total || 0),
          escapeCSV(r.amountReceived || 0),
          escapeCSV(r.balanceDue || 0),
          escapeCSV(r.status || "DRAFT"),
          escapeCSV(r.notes),
          escapeCSV(r.createdAt)
        ].join(",");
      });
      csvContent += dataLines.join("\n");
      toast.success(`Exported ${rows.length} invoice(s) to CSV file!`);
    } else {
      toast.info("No invoice records in database. Downloaded invoice CSV template.");
    }

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `invoices_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [clearing, setClearing] = useState(false);

  const clearAllData = async () => {
    if (!confirm("⚠️ DANGER: This will permanently delete ALL data (clients, packages, invoices, leads, renewals, and documents) from BOTH Supabase Cloud and Local Storage.\n\nAre you sure you want to proceed?")) {
      return;
    }
    setClearing(true);
    try {
      // 1. Purge all records from Supabase Cloud
      await purgeAllUserDataFromSupabase();

      // 2. Purge user-scoped local storage keys
      const email = user?.email || "";
      purgeUserLocalData(email);

      // 3. Reset in-memory Zustand store
      useAppStore.getState().resetStore();

      toast.success("✅ All data successfully deleted from both Cloud Database and Local Storage!");
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to delete data: " + (e?.message || "Unknown error"));
    } finally {
      setClearing(false);
    }
  };

  const tabs = [
    { id: "firm", label: "Firm Details", icon: Building2 },
    { id: "profile", label: "Profile", icon: User },
    { id: "preferences", label: "Preferences", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "billing", label: "Billing & Plan", icon: CreditCard },
    { id: "data", label: "Data & Export", icon: Database },
  ];

  return (
    <AppShell title="Settings" subtitle="Configure your zpluscrm practice workspace">
      <div style={{ display: "flex", gap: 20 }}>

        {/* Sidebar Tabs */}
        <div style={{ width: 210, flexShrink: 0 }}>
          <div className="section-card" style={{ padding: 8 }}>
            {tabs.map(({ id, label, icon: Icon }) => (
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

          {/* ─── FIRM DETAILS ───────────────────────────────────────────── */}
          {tab === "firm" && (
            <div className="section-card">
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, color: "#0F172A" }}>Firm Details</div>
              <div className="form-grid-2">
                <div className="form-group"><label className="form-label">Firm / Practice Name</label><input className="form-input" value={firmName} onChange={e => setFirmName(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Owner / Proprietor Name</label><input className="form-input" value={ownerName} onChange={e => setOwnerName(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Email Address</label><input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Mobile Number</label><input className="form-input" value={mobile} onChange={e => setMobile(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">GSTIN</label><input className="form-input" value={gstin} onChange={e => setGstin(e.target.value)} placeholder="22AAAAA0000A1Z5" /></div>
                <div className="form-group"><label className="form-label">PAN</label><input className="form-input" value={pan} onChange={e => setPan(e.target.value)} placeholder="AAAAA0000A" /></div>
                <div className="form-group"><label className="form-label">Registration / ICAI No.</label><input className="form-input" value={regNo} onChange={e => setRegNo(e.target.value)} placeholder="123456W" /></div>
                <div className="form-group"><label className="form-label">Website</label><input className="form-input" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yourfirm.com" /></div>
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

              {/* Authorized Signature & Stamp Upload Block */}
              <div style={{ marginTop: 16, marginBottom: 20, padding: 18, border: "2px dashed #CBD5E1", borderRadius: 12, background: "#F8FAFC" }}>
                <label className="form-label" style={{ fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: 6, fontSize: 13.5 }}>
                  <PenTool size={16} color="#0176D3" />
                  Authorized Signature & Stamp (For Invoices &amp; Receipts)
                </label>
                <p style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>
                  Upload your digital signature or firm stamp image. It will automatically populate in the Authorized Signatory box on all generated Tax Invoices, Proforma Invoices, and Payment Receipts.
                </p>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleSignatureUpload(file);
                  }}
                  style={{
                    padding: 20,
                    textAlign: "center",
                    background: "#FFFFFF",
                    border: "1.5px dashed #0176D3",
                    borderRadius: 10,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10
                  }}
                >
                  {signatureUrl ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                      <img src={signatureUrl} alt="Authorized Signature" style={{ maxHeight: 75, maxWidth: 220, objectFit: "contain", border: "1px solid #CBD5E1", padding: 6, borderRadius: 8, background: "white" }} />
                      <div style={{ display: "flex", gap: 10 }}>
                        <label className="btn-slds btn-slds-secondary" style={{ padding: "5px 14px", fontSize: 12, cursor: "pointer" }}>
                          Change Signature / Stamp
                          <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleSignatureUpload(file);
                          }} />
                        </label>
                        <button type="button" className="btn-slds" style={{ background: "#FEE2E2", color: "#DC2626", border: "none", padding: "5px 14px", fontSize: 12, borderRadius: 8, fontWeight: 700 }} onClick={() => setSignatureUrl("")}>
                          Remove Signature
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <UploadCloud size={34} color="#0176D3" />
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                        Drag &amp; drop your signature or stamp image here, or <span style={{ color: "#0176D3", textDecoration: "underline" }}>browse files</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#94A3B8" }}>Supports PNG, JPG, JPEG, SVG (Max 5MB)</div>
                      <input type="file" accept="image/*" style={{ display: "none" }} id="signature-input" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSignatureUpload(file);
                      }} />
                      <label htmlFor="signature-input" className="btn-slds btn-slds-primary" style={{ padding: "6px 18px", fontSize: 12, marginTop: 4, cursor: "pointer" }}>
                        Upload Signature File
                      </label>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <button className="btn btn-primary" onClick={handleSaveFirm}><Save size={14} /> Save Firm Details</button>
              </div>
            </div>
          )}

          {/* ─── PROFILE ────────────────────────────────────────────────── */}
          {tab === "profile" && (
            <div className="section-card">
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, color: "#0F172A" }}>Profile</div>
              {user && (
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, padding: "16px", background: "#F8FAFC", borderRadius: 12, border: "1px solid #E2E8F0" }}>
                  <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg, #2563EB, #4F46E5)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 24, fontWeight: 800, flexShrink: 0 }}>
                    {user.email ? user.email.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 15 }}>{user.email}</div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Logged in via Supabase Auth</div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600, color: "#059669" }}>
                      <CheckCircle size={11} /> Verified
                    </div>
                  </div>
                </div>
              )}
              <div className="form-grid-2">
                <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Role / Designation</label><input className="form-input" value={designation} onChange={e => setDesignation(e.target.value)} placeholder="e.g. Chartered Accountant" /></div>
              </div>
              <div className="form-group"><label className="form-label">Bio / About</label>
                <textarea className="form-textarea" value={bio} onChange={e => setBio(e.target.value)} style={{ minHeight: 90 }} placeholder="Brief description about you or your firm..." />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <button className="btn btn-primary" onClick={handleSaveProfile}><Save size={14} /> Save Profile</button>
              </div>
            </div>
          )}

          {/* ─── PREFERENCES ────────────────────────────────────────────── */}
          {tab === "preferences" && (
            <div className="section-card">
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, color: "#0F172A" }}>Preferences</div>

              <div className="form-group">
                <label className="form-label">Primary Brand Color</label>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 6 }}>
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ width: 48, height: 40, cursor: "pointer", borderRadius: 8, border: "none", padding: 2 }} />
                  <span style={{ fontSize: 13, color: "#64748B", fontWeight: 700 }}>{primaryColor}</span>
                  {["#E8520A","#1A237E","#059669","#7C3AED","#DC2626","#2563EB","#D97706"].map(c => (
                    <div key={c} onClick={() => setPrimaryColor(c)} style={{ width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", border: primaryColor === c ? "3px solid #0F172A" : "2px solid transparent", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {primaryColor === c && <Check size={14} color="white" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Date Format</label>
                <select className="form-select" value={dateFormat} onChange={e => setDateFormat(e.target.value)}>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (Indian)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Layout Density</label>
                <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                  {["compact", "comfortable", "spacious"].map(d => (
                    <button key={d} onClick={() => setLayoutDensity(d)}
                      style={{ padding: "8px 20px", borderRadius: 8, border: "2px solid", cursor: "pointer", fontSize: 13, fontWeight: 600, textTransform: "capitalize", borderColor: layoutDensity === d ? "#E8520A" : "#E2E8F0", background: layoutDensity === d ? "#FFF0E8" : "white", color: layoutDensity === d ? "#E8520A" : "#64748B" }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <button className="btn btn-primary" onClick={handleSavePreferences}><Save size={14} /> Save Preferences</button>
              </div>
            </div>
          )}

          {/* ─── NOTIFICATIONS ──────────────────────────────────────────── */}
          {tab === "notifications" && (
            <div className="section-card">
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, color: "#0F172A" }}>Notification Settings</div>
              {([
                { key: "dueDate7", label: "Due date reminders (7 days before)", desc: "Get notified when a service is due in 7 days" },
                { key: "overdue", label: "Overdue alerts", desc: "Get notified when a service is overdue" },
                { key: "paymentReceived", label: "Payment received", desc: "Notification when amount is marked as received" },
                { key: "newLead", label: "New lead from WhatsApp", desc: "Alert when a new WhatsApp message comes in" },
                { key: "invoiceCreated", label: "Invoice created confirmation", desc: "Notify when a new invoice is generated" },
                { key: "weeklyReport", label: "Weekly summary report", desc: "Get a weekly summary of tasks and payments" },
              ] as const).map(({ key, label, desc }) => (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #F1F5F9" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 14 }}>{label}</div>
                    <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{desc}</div>
                  </div>
                  <Toggle checked={notifs[key]} onChange={v => setNotifs(prev => ({ ...prev, [key]: v }))} />
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                <button className="btn btn-primary" onClick={handleSaveNotifs}><Save size={14} /> Save Notification Settings</button>
              </div>
            </div>
          )}

          {/* ─── SECURITY ───────────────────────────────────────────────── */}
          {tab === "security" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Change Password */}
              <div className="section-card">
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
                  <KeyRound size={18} color="#E8520A" /> Change Password
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <div style={{ position: "relative" }}>
                      <input className="form-input" type={showPwds ? "text" : "password"} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Min. 8 characters" style={{ paddingRight: 40 }} />
                      <button type="button" onClick={() => setShowPwds(p => !p)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}>
                        {showPwds ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {newPwd && (
                      <div style={{ marginTop: 6, display: "flex", gap: 4, alignItems: "center" }}>
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: newPwd.length >= i * 3 ? (newPwd.length >= 12 ? "#059669" : newPwd.length >= 8 ? "#D97706" : "#EF4444") : "#E2E8F0" }} />
                        ))}
                        <span style={{ fontSize: 10, color: "#94A3B8", marginLeft: 4 }}>{newPwd.length < 8 ? "Weak" : newPwd.length < 12 ? "Fair" : "Strong"}</span>
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input className="form-input" type={showPwds ? "text" : "password"} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Re-enter new password" style={{ borderColor: confirmPwd && confirmPwd !== newPwd ? "#EF4444" : undefined }} />
                    {confirmPwd && (
                      <p style={{ fontSize: 11, marginTop: 4, color: confirmPwd === newPwd ? "#059669" : "#EF4444" }}>
                        {confirmPwd === newPwd ? "✓ Passwords match" : "✗ Passwords do not match"}
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                  <button className="btn btn-primary" onClick={handleChangePassword} disabled={changingPwd} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {changingPwd ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> : <KeyRound size={14} />}
                    {changingPwd ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>

              {/* Account */}
              <div className="section-card">
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
                  <Shield size={18} color="#E8520A" /> Account
                </div>
                {user && (
                  <div style={{ padding: "12px 16px", background: "#F8FAFC", borderRadius: 10, marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>Currently signed in as</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>{user.email}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>User ID: {user.id?.slice(0, 16)}...</div>
                  </div>
                )}
                <button
                  onClick={handleSignOut}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, color: "#DC2626", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  <LogOut size={15} /> Sign Out of All Sessions
                </button>
              </div>
            </div>
          )}

          {/* ─── BILLING ────────────────────────────────────────────────── */}
          {tab === "billing" && (
            <div className="section-card">
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
                <CreditCard size={18} color="#E8520A" /> Billing & Subscription
              </div>
              <div style={{ padding: "20px 24px", background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", borderRadius: 16, marginBottom: 20, border: "1.5px solid #334155" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#54B400", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Current Plan</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#FFFFFF" }}>Professional Plan</div>
                    <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>Full access to all CRM &amp; Supabase practice modules</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: "#FFFFFF" }}>₹2,499</div>
                    <div style={{ fontSize: 12, color: "#64748B" }}>per month</div>
                  </div>
                </div>
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: "#64748B" }}>Next billing date: <strong style={{ color: "#94A3B8" }}>September 1, 2026</strong></div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(84,180,0,0.15)", border: "1px solid rgba(84,180,0,0.3)", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: "#54B400" }}>
                    ● ACTIVE
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Active Clients", used: String(clients.length), max: "Unlimited", icon: "👥" },
                  { label: "Generated Invoices", used: String(invoices.length), max: "Unlimited", icon: "📄" },
                  { label: "Team Members", used: "1", max: "5", icon: "👤" },
                ].map(item => (
                  <div key={item.label} style={{ padding: "14px 16px", background: "#F8FAFC", borderRadius: 12, border: "1px solid #E2E8F0", textAlign: "center" }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{item.icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>{item.used}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>{item.label} of {item.max}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding: "16px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 4 }}>💡 Upgrade to Enterprise</div>
                <div style={{ fontSize: 12, color: "#78350F" }}>Get unlimited team members, white-labeling, priority support, and custom integrations.</div>
                <button
                  onClick={() => toast.success("Contact Sales request sent! Our enterprise team will reach out shortly.")}
                  style={{ marginTop: 10, padding: "8px 16px", background: "#D97706", border: "none", borderRadius: 8, color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Contact Sales →
                </button>
              </div>
            </div>
          )}

          {/* ─── DATA & EXPORT ───────────────────────────────────────────── */}
          {tab === "data" && (
            <div className="section-card">
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
                <Database size={18} color="#E8520A" /> Data & Export
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                <div style={{ padding: "16px", background: "#F8FAFC", borderRadius: 12, border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 14 }}>Export Clients</div>
                    <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
                      Download all client records as CSV ({clients.length} clients in practice database)
                    </div>
                  </div>
                  <button onClick={exportClientsCSV} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 13 }}>
                    <Download size={14} /> Download CSV
                  </button>
                </div>

                <div style={{ padding: "16px", background: "#F8FAFC", borderRadius: 12, border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 14 }}>Export Invoices</div>
                    <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
                      Download complete invoice history as CSV ({invoices.length} invoices in practice database)
                    </div>
                  </div>
                  <button onClick={exportInvoicesCSV} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 13 }}>
                    <Download size={14} /> Download CSV
                  </button>
                </div>
              </div>

              <div style={{ padding: "20px", background: "#FEF2F2", border: "1.5px solid #FCA5A5", borderRadius: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#991B1B", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <Trash2 size={16} /> Danger Zone: Delete All Account Data (Cloud & Local)
                </div>
                <div style={{ fontSize: 13, color: "#7F1D1D", marginBottom: 14, lineHeight: 1.5 }}>
                  Permanently deletes all practice data (clients, packages, invoices, leads, renewals, and documents) from both <strong>Supabase Cloud Database</strong> and <strong>Local Browser Storage</strong>.
                </div>
                <button
                  disabled={clearing}
                  onClick={clearAllData}
                  style={{
                    padding: "10px 18px",
                    background: "#DC2626",
                    border: "none",
                    borderRadius: 10,
                    color: "white",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: clearing ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    opacity: clearing ? 0.7 : 1
                  }}
                >
                  <Trash2 size={14} /> {clearing ? "Deleting Everything..." : "Delete All Data (Cloud & Local)"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </AppShell>
  );
}
