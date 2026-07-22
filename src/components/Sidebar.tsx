"use client";
import { useAppStore } from "@/lib/store";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, MessageSquare, Briefcase, Layers,
  FileText, ClipboardList, Building2, Calendar, PenTool,
  CreditCard, Settings, ChevronLeft, ChevronRight
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/leads", label: "WhatsApp Leads", icon: MessageSquare },
  { href: "/services", label: "Services", icon: Briefcase },
  { href: "/sub-services", label: "Sub Services", icon: Layers },
  { href: "/required-docs", label: "Required Docs", icon: FileText },
  { href: "/assign", label: "Assign Services", icon: ClipboardList },
  { href: "/banking", label: "Banking", icon: Building2 },
  { href: "/due-dates", label: "Due Dates", icon: Calendar },
  { href: "/drafts", label: "Document Drafts", icon: PenTool },
  { href: "/subscription", label: "Subscription", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();

  return (
    <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontWeight: 900, fontSize: 16, color: "white" }}>C</span>
        </div>
        {!sidebarCollapsed && (
          <div className="sidebar-logo-text">
            cma<span>expert</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={`nav-item ${isActive ? "active" : ""}`}>
              <Icon className="nav-icon" />
              <span className="nav-label">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.15)" }}>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="nav-item"
          style={{ justifyContent: sidebarCollapsed ? "center" : "flex-start" }}
        >
          {sidebarCollapsed
            ? <ChevronRight className="nav-icon" />
            : <><ChevronLeft className="nav-icon" /><span className="nav-label">Collapse</span></>
          }
        </button>
      </div>
    </aside>
  );
}
