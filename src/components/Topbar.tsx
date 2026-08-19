"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/context/AuthContext";
import { Bell, Search, Grid, Plus, UserPlus, FilePlus, LogOut, LogIn, KeyRound, StickyNote } from "lucide-react";
import { getFYOptions } from "@/lib/utils";
import GlobalSearchModal from "./GlobalSearchModal";
import FloatingNotes from "./FloatingNotes";
import Link from "next/link";

interface TopbarProps {
  title: string;
  subtitle?: string;
  onOpenSearch?: () => void;
}

export default function Topbar({ title, subtitle, onOpenSearch }: TopbarProps) {
  const { selectedFY, setSelectedFY, sidebarCollapsed, subServices, renewals, leads } = useAppStore();
  const { user, signOut } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isAppLauncherOpen, setIsAppLauncherOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const fyOptions = getFYOptions();

  // ── Live Notification Computation ──────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueServices = useMemo(() => {
    return (subServices || []).filter(ss => {
      if (!ss.dueDate) return false;
      const d = new Date(ss.dueDate);
      d.setHours(0, 0, 0, 0);
      return d < today;
    });
  }, [subServices, today.toDateString()]);

  const upcomingRenewals = useMemo(() => {
    const in7 = new Date(today);
    in7.setDate(in7.getDate() + 7);
    return (renewals || []).filter(rn => {
      if (!rn.dueDate) return false;
      const d = new Date(rn.dueDate);
      d.setHours(0, 0, 0, 0);
      return d >= today && d <= in7;
    });
  }, [renewals, today.toDateString()]);

  const recentLeads = useMemo(() => {
    const since7 = new Date(today);
    since7.setDate(since7.getDate() - 7);
    return (leads || []).filter(l => {
      if (l.status === "CONVERTED") return false;
      if (!l.createdAt) return true;
      return new Date(l.createdAt) >= since7;
    });
  }, [leads, today.toDateString()]);

  const totalNotifCount = overdueServices.length + upcomingRenewals.length + recentLeads.length;

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          {/* zpluscrm App Launcher */}
          <button
            type="button"
            className="app-launcher-btn"
            title="zpluscrm App Launcher"
            onClick={(e) => { e.preventDefault(); setIsAppLauncherOpen(!isAppLauncherOpen); }}
          >
            <Grid size={18} />
          </button>

          <div className="topbar-title-wrapper">
            <div className="topbar-title">{title}</div>
            {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
          </div>
        </div>

        {/* Center: Search Trigger Bar */}
        <div className="search-trigger-btn" onClick={() => setIsSearchOpen(true)}>
          <Search size={16} />
          <span>Search CRM (Clients, Leads, Services...)</span>
          <span className="kbd-shortcut">Ctrl K</span>
        </div>

        {/* Right Actions */}
        <div className="topbar-right">
          {/* Quick Create Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className="btn-slds btn-slds-primary"
              style={{ padding: "6px 12px", fontSize: 13 }}
              onClick={(e) => { e.preventDefault(); setIsQuickCreateOpen(!isQuickCreateOpen); }}
            >
              <Plus size={15} />
              <span>Quick Create</span>
            </button>

            {isQuickCreateOpen && (
              <div style={{
                position: "absolute",
                top: 42,
                right: 0,
                width: 180,
                background: "white",
                borderRadius: 12,
                boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                border: "1px solid #E2E8F0",
                zIndex: 50,
                padding: 6
              }}>
                <Link
                  href="/clients"
                  className="command-item"
                  onClick={() => setIsQuickCreateOpen(false)}
                  style={{ textDecoration: "none" }}
                >
                  <UserPlus size={15} color="#0176D3" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>New Client</span>
                </Link>
                <Link
                  href="/leads"
                  className="command-item"
                  onClick={() => setIsQuickCreateOpen(false)}
                  style={{ textDecoration: "none" }}
                >
                  <Plus size={15} color="#F59E0B" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>New Lead</span>
                </Link>
                <Link
                  href="/drafts"
                  className="command-item"
                  onClick={() => setIsQuickCreateOpen(false)}
                  style={{ textDecoration: "none" }}
                >
                  <FilePlus size={15} color="#10B981" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>New Draft</span>
                </Link>
              </div>
            )}
          </div>

          {/* Financial Year Selector */}
          <select
            className="fy-selector-slds"
            value={selectedFY}
            onChange={e => setSelectedFY(e.target.value)}
          >
            {fyOptions.map(fy => (
              <option key={fy} value={fy}>FY {fy}</option>
            ))}
          </select>

          {/* Notes Button */}
          <button
            className="icon-btn-slds"
            title="Quick Notes"
            onClick={() => setIsNotesOpen(prev => !prev)}
            style={isNotesOpen ? { background: "rgba(99,102,241,0.15)", color: "#818CF8" } : undefined}
          >
            <StickyNote size={17} />
          </button>

          {/* Notification Button & Popover */}
          <div style={{ position: "relative" }}>
            <button
              className="icon-btn-slds"
              title="Notifications"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              style={{ position: "relative" }}
            >
              <Bell size={17} />
              {totalNotifCount > 0 && (
                <span style={{
                  position: "absolute", top: 2, right: 2,
                  background: "#DC2626", color: "white",
                  fontSize: 9, fontWeight: 800,
                  minWidth: 14, height: 14, borderRadius: 7,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "0 3px"
                }}>{totalNotifCount > 9 ? "9+" : totalNotifCount}</span>
              )}
            </button>

            {isNotificationsOpen && (
              <div style={{
                position: "absolute",
                top: 42,
                right: 0,
                width: 300,
                background: "white",
                borderRadius: 12,
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                border: "1px solid #CBD5E1",
                zIndex: 60,
                padding: 12,
                maxHeight: 400,
                overflowY: "auto"
              }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#0F172A", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Live Notifications</span>
                  {totalNotifCount > 0 && (
                    <span style={{ fontSize: 10, background: "#FEE2E2", color: "#DC2626", padding: "2px 6px", borderRadius: 8, fontWeight: 700 }}>{totalNotifCount} Active</span>
                  )}
                </div>
                <div style={{ display: "grid", gap: 8, fontSize: 12 }}>
                  {overdueServices.length > 0 && (
                    <Link href="/due-dates" onClick={() => setIsNotificationsOpen(false)} style={{ textDecoration: "none", color: "#334155", padding: "8px 10px", background: "#FEF2F2", borderRadius: 8, display: "block", border: "1px solid #FECACA" }}>
                      <div style={{ fontWeight: 700, color: "#DC2626", marginBottom: 2 }}>⚠️ {overdueServices.length} Overdue Filing{overdueServices.length > 1 ? "s" : ""}</div>
                      <div style={{ fontSize: 11, color: "#64748B" }}>{overdueServices.slice(0, 2).map(s => s.name).join(", ")}{overdueServices.length > 2 ? ` +${overdueServices.length - 2} more` : ""}</div>
                    </Link>
                  )}
                  {upcomingRenewals.length > 0 && (
                    <Link href="/renewals" onClick={() => setIsNotificationsOpen(false)} style={{ textDecoration: "none", color: "#334155", padding: "8px 10px", background: "#FFFBEB", borderRadius: 8, display: "block", border: "1px solid #FDE68A" }}>
                      <div style={{ fontWeight: 700, color: "#D97706", marginBottom: 2 }}>🔄 {upcomingRenewals.length} Renewal{upcomingRenewals.length > 1 ? "s" : ""} Due This Week</div>
                      <div style={{ fontSize: 11, color: "#64748B" }}>{upcomingRenewals.slice(0, 2).map(r => r.serviceName || r.clientName).join(", ")}{upcomingRenewals.length > 2 ? ` +${upcomingRenewals.length - 2} more` : ""}</div>
                    </Link>
                  )}
                  {recentLeads.length > 0 && (
                    <Link href="/leads" onClick={() => setIsNotificationsOpen(false)} style={{ textDecoration: "none", color: "#334155", padding: "8px 10px", background: "#F0FDF4", borderRadius: 8, display: "block", border: "1px solid #BBF7D0" }}>
                      <div style={{ fontWeight: 700, color: "#059669", marginBottom: 2 }}>💬 {recentLeads.length} New Lead{recentLeads.length > 1 ? "s" : ""} (Last 7 Days)</div>
                      <div style={{ fontSize: 11, color: "#64748B" }}>{recentLeads.slice(0, 2).map(l => l.name).join(", ")}{recentLeads.length > 2 ? ` +${recentLeads.length - 2} more` : ""}</div>
                    </Link>
                  )}
                  {totalNotifCount === 0 && (
                    <div style={{ textAlign: "center", padding: "16px 8px", color: "#64748B", fontSize: 12 }}>
                      ✅ All clear! No pending alerts.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Auth Button */}
          <div style={{ position: "relative" }}>
            {user ? (
              <button
                className="avatar-slds"
                title={user.email || "Authenticated User"}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                style={{ cursor: "pointer", background: "linear-gradient(135deg, #2563EB, #4F46E5)", color: "white", fontWeight: 700 }}
              >
                {user.email ? user.email.charAt(0).toUpperCase() : "U"}
              </button>
            ) : (
              <Link href="/login" className="btn-slds" style={{ padding: "6px 12px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                <LogIn size={15} />
                <span>Sign In</span>
              </Link>
            )}

            {isUserMenuOpen && user && (() => {
              let firmSettings: any = {};
              if (typeof window !== "undefined") {
                try { firmSettings = JSON.parse(localStorage.getItem("zpluscrm_settings") || "{}"); } catch {}
              }
              const userMeta = user?.user_metadata || {};
              const companyOrUserName =
                firmSettings.firmName ||
                firmSettings.ownerName ||
                userMeta.company_name ||
                userMeta.firm_name ||
                userMeta.full_name ||
                (user?.email ? user.email.split("@")[0].toUpperCase() + " Practice" : "Registered User");

              return (
                <div style={{
                  position: "absolute",
                  top: 45,
                  right: 0,
                  width: 230,
                  background: "white",
                  borderRadius: 12,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                  border: "1px solid #E2E8F0",
                  zIndex: 50,
                  padding: 12
                }}>
                  <div style={{ paddingBottom: 8, marginBottom: 8, borderBottom: "1px solid #F1F5F9" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Signed in as</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>{companyOrUserName}</div>
                    <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 1, wordBreak: "break-all" }}>{user.email}</div>
                  </div>

                <Link
                  href="/login"
                  onClick={() => setIsUserMenuOpen(false)}
                  style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", fontSize: 13, fontWeight: 500, color: "#334155", borderRadius: 6 }}
                >
                  <KeyRound size={15} color="#4F46E5" />
                  <span>Update Password</span>
                </Link>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    signOut();
                  }}
                  style={{ width: "100%", background: "none", border: "none", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", fontSize: 13, fontWeight: 600, color: "#EF4444", borderRadius: 6, cursor: "pointer" }}
                >
                  <LogOut size={15} color="#EF4444" />
                  <span>Sign Out</span>
                </button>
              </div>
              );
            })()}
          </div>
        </div>
      </header>

      {/* App Launcher Modal Popover */}
      {isAppLauncherOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 90 }}
          onClick={() => setIsAppLauncherOpen(false)}
        >
          <div
            style={{
              position: "absolute",
              top: 60,
              left: 20,
              width: 320,
              background: "#0F172A",
              border: "1px solid #1E293B",
              borderRadius: 16,
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
              padding: 16,
              color: "white"
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#94A3B8", marginBottom: 12 }}>
              zpluscrm Apps & Modules
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <Link
                href="/"
                onClick={() => setIsAppLauncherOpen(false)}
                style={{ textAlign: "center", padding: 8, background: "#1E293B", borderRadius: 10, cursor: "pointer", textDecoration: "none", color: "white" }}
              >
                <div style={{ fontSize: 20 }}>📊</div>
                <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4 }}>CRM Hub</div>
              </Link>
              <Link
                href="/banking"
                onClick={() => setIsAppLauncherOpen(false)}
                style={{ textAlign: "center", padding: 8, background: "#1E293B", borderRadius: 10, cursor: "pointer", textDecoration: "none", color: "white" }}
              >
                <div style={{ fontSize: 20 }}>💰</div>
                <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4 }}>Billing</div>
              </Link>
              <Link
                href="/required-docs"
                onClick={() => setIsAppLauncherOpen(false)}
                style={{ textAlign: "center", padding: 8, background: "#1E293B", borderRadius: 10, cursor: "pointer", textDecoration: "none", color: "white" }}
              >
                <div style={{ fontSize: 20 }}>📂</div>
                <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4 }}>Docs</div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Floating Notes Panel */}
      <FloatingNotes isOpen={isNotesOpen} onClose={() => setIsNotesOpen(false)} />
    </>
  );
}
