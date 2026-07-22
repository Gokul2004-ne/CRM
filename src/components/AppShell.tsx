"use client";
import { useAppStore } from "@/lib/store";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AppShell({ children, title, subtitle }: AppShellProps) {
  const { sidebarCollapsed } = useAppStore();
  return (
    <div className="app-shell">
      <Sidebar />
      <div className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <Topbar title={title} subtitle={subtitle} />
        <div className="page-wrapper animate-in">{children}</div>
      </div>
    </div>
  );
}
