"use client";
import { useAppStore } from "@/lib/store";
import { Bell, Search } from "lucide-react";
import { getFYOptions } from "@/lib/utils";

interface TopbarProps { title: string; subtitle?: string; }

export default function Topbar({ title, subtitle }: TopbarProps) {
  const { selectedFY, setSelectedFY, sidebarCollapsed } = useAppStore();
  const fyOptions = getFYOptions();

  return (
    <header className={`topbar ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <div>
        <div className="topbar-title">{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 1 }}>{subtitle}</div>}
      </div>
      <div className="topbar-right">
        <select
          className="fy-selector"
          value={selectedFY}
          onChange={e => setSelectedFY(e.target.value)}
        >
          {fyOptions.map(fy => (
            <option key={fy} value={fy}>FY {fy}</option>
          ))}
        </select>
        <button className="btn btn-ghost btn-icon" style={{ color: "rgba(255,255,255,0.8)" }}>
          <Bell size={18} />
        </button>
        <div className="avatar">G</div>
      </div>
    </header>
  );
}
