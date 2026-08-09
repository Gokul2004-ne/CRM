"use client";
import { useAppStore } from "@/lib/store";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, MessageSquare, Package, Layers,
  FileText, ClipboardList, Building2, Calendar, PenTool,
  CreditCard, Settings, Handshake, Receipt, Sparkles, RefreshCw, Zap
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed, clients, leads, collaborations, assignedServices } = useAppStore();

  const activeLeadsCount = leads.filter(l => l.status !== "CONVERTED").length;
  const activeClientsCount = clients.length;
  const collaborationsCount = collaborations?.length || 0;

  const categories = [
    {
      title: "Core CRM & Sales",
      items: [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/clients", label: "Clients", icon: Users, badge: activeClientsCount },
        { href: "/collaborations", label: "Collaborations", icon: Handshake, badge: collaborationsCount > 0 ? collaborationsCount : undefined },
        { href: "/leads", label: "WhatsApp Leads", icon: MessageSquare, badge: activeLeadsCount > 0 ? activeLeadsCount : undefined },
      ]
    },
    {
      title: "Operations & Packages",
      items: [
        { href: "/services", label: "Packages", icon: Package },
        { href: "/sub-services", label: "Services", icon: Layers },
        { href: "/required-docs", label: "Required Docs", icon: FileText },
        { href: "/assign", label: "Assign Packages", icon: ClipboardList, badge: assignedServices.length },
        { href: "/service-clients", label: "Clients by Service", icon: Users },
        { href: "/one-time-services", label: "One Time Service", icon: Sparkles },
        { href: "/renewals", label: "Renewals", icon: RefreshCw },
      ]
    },
    {
      title: "Financials & Billing",
      items: [
        { href: "/banking", label: "Banking & Ledger", icon: Building2 },
        { href: "/due-dates", label: "Compliance Calendar", icon: Calendar },
        { href: "/invoice", label: "Invoices", icon: Receipt },
        { href: "/drafts", label: "Document Drafts", icon: PenTool },
      ]
    },
    {
      title: "Enterprise System",
      items: [
        { href: "/automations", label: "Smart Automations", icon: Zap },
        { href: "/subscription", label: "Subscription", icon: CreditCard },
        { href: "/settings", label: "Settings", icon: Settings },
      ]
    }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Logo Header */}
      <div className="sidebar-logo">
        <img
          src="/zplus-icon.svg"
          alt="zpluscrm logo"
          style={{ width: 34, height: 34, objectFit: "contain" }}
        />
        <div className="sidebar-logo-text" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <span style={{ color: "#FFFFFF", fontWeight: 900 }}>zplus</span>
          <span style={{ color: "#54B400", fontWeight: 900 }}>crm</span>
        </div>
      </div>

      {/* Categorized Navigation List */}
      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
        {categories.map((cat) => (
          <div key={cat.title}>
            <div className="sidebar-category">{cat.title}</div>
            {cat.items.map(({ href, label, icon: Icon, badge }) => {
              const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  scroll={false}
                  className={`nav-item ${isActive ? "active" : ""}`}
                  onClick={(e) => {
                    if (isActive) {
                      e.preventDefault();
                    }
                  }}
                >
                  <Icon className="nav-icon" />
                  <span className="nav-label">{label}</span>
                  {badge !== undefined && <span className="nav-badge">{badge}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
