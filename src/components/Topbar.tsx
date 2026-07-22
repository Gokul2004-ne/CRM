"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/context/AuthContext";
import { Bell, Search, Grid, Plus, UserPlus, FilePlus, LogOut, LogIn, KeyRound } from "lucide-react";
import { getFYOptions } from "@/lib/utils";
import GlobalSearchModal from "./GlobalSearchModal";
import Link from "next/link";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const { selectedFY, setSelectedFY, sidebarCollapsed } = useAppStore();
  const { user, signOut } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isAppLauncherOpen, setIsAppLauncherOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const fyOptions = getFYOptions();

  return (
    <>
      <header className={`topbar ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="topbar-left">
          {/* Salesforce 9-Dot App Launcher */}
          <button
            className="app-launcher-btn"
            title="Salesforce App Launcher"
            onClick={() => setIsAppLauncherOpen(!isAppLauncherOpen)}
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
              className="btn-slds btn-slds-primary"
              style={{ padding: "6px 12px", fontSize: 13 }}
              onClick={() => setIsQuickCreateOpen(!isQuickCreateOpen)}
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

          {/* Notification Button */}
          <button className="icon-btn-slds" title="Notifications">
            <Bell size={17} />
            <span className="notification-dot"></span>
          </button>

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

            {isUserMenuOpen && user && (
              <div style={{
                position: "absolute",
                top: 45,
                right: 0,
                width: 220,
                background: "white",
                borderRadius: 12,
                boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                border: "1px solid #E2E8F0",
                zIndex: 50,
                padding: 12
              }}>
                <div style={{ paddingBottom: 8, marginBottom: 8, borderBottom: "1px solid #F1F5F9" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Signed in as</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", wordBreak: "break-all" }}>{user.email}</div>
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
            )}
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
              Salesforce / Zoho Apps
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <div style={{ textAlign: "center", padding: 8, background: "#1E293B", borderRadius: 10, cursor: "pointer" }}>
                <div style={{ fontSize: 20 }}>📊</div>
                <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4 }}>CRM Hub</div>
              </div>
              <div style={{ textAlign: "center", padding: 8, background: "#1E293B", borderRadius: 10, cursor: "pointer" }}>
                <div style={{ fontSize: 20 }}>💰</div>
                <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4 }}>Billing</div>
              </div>
              <div style={{ textAlign: "center", padding: 8, background: "#1E293B", borderRadius: 10, cursor: "pointer" }}>
                <div style={{ fontSize: 20 }}>📂</div>
                <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4 }}>Docs</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
