"use client";
import { useAppStore } from "@/lib/store";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, MessageSquare, Briefcase, Layers,
  FileText, ClipboardList, Building2, Calendar, PenTool,
  CreditCard, Settings, ChevronLeft, ChevronRight, Shield
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed, clients, leads, assignedServices } = useAppStore();

  const activeLeadsCount = leads.filter(l => l.status !== "CONVERTED").length;
  const activeClientsCount = clients.length;

  const categories = [
    {
      title: "Core CRM & Sales",
      items: [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/clients", label: "Clients", icon: Users, badge: activeClientsCount },
        { href: "/leads", label: "WhatsApp Leads", icon: MessageSquare, badge: activeLeadsCount > 0 ? activeLeadsCount : undefined },
      ]
    },
    {
      title: "Operations & Services",
      items: [
        { href: "/services", label: "Services", icon: Briefcase },
        { href: "/sub-services", label: "Sub Services", icon: Layers },
        { href: "/required-docs", label: "Required Docs", icon: FileText },
        { href: "/assign", label: "Assign Services", icon: ClipboardList, badge: assignedServices.length },
      ]
    },
    {
      title: "Financials & Billing",
      items: [
        { href: "/banking", label: "Banking & Ledger", icon: Building2 },
        { href: "/due-dates", label: "Due Dates Grid", icon: Calendar },
        { href: "/drafts", label: "Document Drafts", icon: PenTool },
      ]
    },
    {
      title: "Enterprise System",
      items: [
        { href: "/subscription", label: "Subscription", icon: CreditCard },
        { href: "/settings", label: "Settings", icon: Settings },
      ]
    }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Logo Header */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          C
        </div>
        <div className="sidebar-logo-text">
          crm<span>expert</span>
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
