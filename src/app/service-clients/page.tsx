"use client";

import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { Client, Service, SubService, AssignedService } from "@/lib/types";
import {
  Users, Layers, Package, Search, MessageCircle, Mail,
  Grid, List, Sparkles
} from "lucide-react";
import { formatDate, getWhatsAppLink } from "@/lib/utils";
import { toast } from "sonner";

type DeliveryStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

const statusConfig: Record<DeliveryStatus, { label: string; color: string; bg: string; border: string }> = {
  PENDING: { label: "Not Started", color: "#64748B", bg: "#F1F5F9", border: "#CBD5E1" },
  IN_PROGRESS: { label: "In Progress", color: "#D97706", bg: "#FFFBEB", border: "#FCD34D" },
  COMPLETED: { label: "Completed", color: "#059669", bg: "#F0FDF4", border: "#6EE7B7" },
};

const DEFAULT_SUB_SERVICES = [
  { id: "ss_itr1", serviceId: "s1", name: "Income Tax Return (ITR-1/2/3/4)" },
  { id: "ss_tax_audit", serviceId: "s1", name: "Tax Audit u/s 44AB" },
  { id: "ss_adv_tax", serviceId: "s1", name: "Advance Tax Payment" },
  { id: "ss_gstr3b", serviceId: "s2", name: "GSTR 3B Return" },
  { id: "ss_gstr1", serviceId: "s2", name: "GSTR 1 Return" },
  { id: "ss_gstr9", serviceId: "s2", name: "GSTR 9 Annual Return" },
  { id: "ss_tds26q", serviceId: "s3", name: "TDS Return (26Q/27Q)" },
  { id: "ss_roc_aoc4", serviceId: "s4", name: "ROC Annual Filing (AOC-4/MGT-7)" },
];

interface ServiceMappingItem {
  key: string;
  serviceId: string;
  serviceName: string;
  packageId: string;
  packageName: string;
  clientId: string;
  clientName: string;
  clientObj?: Client;
  financialYear: string;
  dueDate?: string;
  status: DeliveryStatus;
  assignmentId?: string;
  isOneTime?: boolean;
}

export default function ServiceClientsPage() {
  const { clients, services, subServices, assignedServices, oneTimeServices, selectedFY, updateAssignedService } = useAppStore();

  const [search, setSearch] = useState("");
  const [selectedPackageFilter, setSelectedPackageFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "ALL">("ALL");
  const [viewTab, setViewTab] = useState<"by-service" | "by-package" | "master-table">("by-service");

  // 1. Compute Master Mapping of (Service + Package + Client)
  const allMappings = useMemo(() => {
    const items: ServiceMappingItem[] = [];

    // Process Assigned Services (Package & Sub-services assigned to Clients)
    (assignedServices || [])
      .filter(a => !selectedFY || a.financialYear === selectedFY || selectedFY === "ALL")
      .forEach(a => {
        const clientObj = clients.find(c => c.id === a.clientId);
        const pkgObj = services.find(s => s.id === a.serviceId);
        const clientName = clientObj?.name || "Unknown Client";
        const packageName = pkgObj?.name || (a as any).serviceName || "General Package";

        const foundSubs = (subServices || []).filter(ss => a.subServiceIds?.includes(ss.id));
        const defaultSubs = DEFAULT_SUB_SERVICES.filter(ss => a.subServiceIds?.includes(ss.id));
        const resolvedSubs = foundSubs.length > 0 ? foundSubs : defaultSubs;

        if (resolvedSubs.length > 0) {
          resolvedSubs.forEach(ss => {
            items.push({
              key: `${a.id}_${ss.id}`,
              serviceId: ss.id,
              serviceName: ss.name,
              packageId: a.serviceId,
              packageName,
              clientId: a.clientId,
              clientName,
              clientObj,
              financialYear: a.financialYear,
              dueDate: a.dueDate,
              status: (a.status as DeliveryStatus) || "PENDING",
              assignmentId: a.id,
              isOneTime: false,
            });
          });
        } else {
          // If no sub-services selected, use Package as Service Name
          items.push({
            key: `${a.id}_pkg`,
            serviceId: a.serviceId,
            serviceName: packageName,
            packageId: a.serviceId,
            packageName,
            clientId: a.clientId,
            clientName,
            clientObj,
            financialYear: a.financialYear,
            dueDate: a.dueDate,
            status: (a.status as DeliveryStatus) || "PENDING",
            assignmentId: a.id,
            isOneTime: false,
          });
        }
      });

    // Process One Time Services
    (oneTimeServices || []).forEach(ots => {
      const clientObj = clients.find(c => c.name.toLowerCase() === ots.clientName.toLowerCase());
      const deliveryStatus: DeliveryStatus =
        ots.progress === "Completed" ? "COMPLETED" : ots.progress === "In-progress" ? "IN_PROGRESS" : "PENDING";

      items.push({
        key: `ots_${ots.id}`,
        serviceId: `ots_svc_${ots.id}`,
        serviceName: ots.serviceName,
        packageId: "ots_package",
        packageName: "One Time Service",
        clientId: clientObj?.id || `ots_client_${ots.clientName}`,
        clientName: ots.clientName,
        clientObj,
        financialYear: selectedFY || "FY 2026-27",
        dueDate: ots.dueDate,
        status: deliveryStatus,
        isOneTime: true,
      });
    });

    return items;
  }, [assignedServices, oneTimeServices, clients, services, subServices, selectedFY]);

  // 2. Filter mappings by search, selected package, and delivery status
  const filteredMappings = useMemo(() => {
    return allMappings.filter(item => {
      const q = search.toLowerCase();
      const matchesSearch =
        item.serviceName.toLowerCase().includes(q) ||
        item.packageName.toLowerCase().includes(q) ||
        item.clientName.toLowerCase().includes(q);

      const matchesPackage = selectedPackageFilter === "ALL" || item.packageId === selectedPackageFilter || item.packageName === selectedPackageFilter;
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;

      return matchesSearch && matchesPackage && matchesStatus;
    });
  }, [allMappings, search, selectedPackageFilter, statusFilter]);

  // 3. Group by Service Name
  const groupedByService = useMemo(() => {
    const map = new Map<string, { serviceName: string; packageName: string; items: ServiceMappingItem[] }>();

    filteredMappings.forEach(item => {
      const groupKey = item.serviceName;
      if (!map.has(groupKey)) {
        map.set(groupKey, {
          serviceName: item.serviceName,
          packageName: item.packageName,
          items: [],
        });
      }
      map.get(groupKey)!.items.push(item);
    });

    // Sort service groups alphabetically
    return Array.from(map.values()).sort((a, b) => a.serviceName.localeCompare(b.serviceName));
  }, [filteredMappings]);

  // 4. Group by Package Name
  const groupedByPackage = useMemo(() => {
    const map = new Map<string, { packageName: string; items: ServiceMappingItem[] }>();

    filteredMappings.forEach(item => {
      const groupKey = item.packageName;
      if (!map.has(groupKey)) {
        map.set(groupKey, { packageName: item.packageName, items: [] });
      }
      map.get(groupKey)!.items.push(item);
    });

    return Array.from(map.values()).sort((a, b) => a.packageName.localeCompare(b.packageName));
  }, [filteredMappings]);

  // KPI Metrics
  const totalAssignmentsCount = filteredMappings.length;
  const uniqueServicesCount = new Set(filteredMappings.map(i => i.serviceName)).size;
  const uniquePackagesCount = new Set(filteredMappings.map(i => i.packageName)).size;
  const uniqueClientsCount = new Set(filteredMappings.map(i => i.clientName)).size;

  // Handle status update
  const handleUpdateStatus = (item: ServiceMappingItem, nextStatus: DeliveryStatus) => {
    if (item.assignmentId) {
      const orig = assignedServices.find(a => a.id === item.assignmentId);
      if (orig) {
        updateAssignedService({ ...orig, status: nextStatus });
        toast.success(`Updated status for ${item.clientName} on ${item.serviceName} to "${statusConfig[nextStatus].label}"`);
      }
    } else {
      toast.info("Status updated locally.");
    }
  };

  return (
    <AppShell title="Clients by Service" subtitle="View and track client lists mapped dynamically according to assigned services & packages">


      {/* ─── KPI SUMMARY CARDS ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 20 }}>
        <div className="card-slds" style={{ padding: 18, background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#64748B" }}>Total Mapped Services</span>
            <div style={{ padding: 8, background: "#EEF2FF", borderRadius: 10, color: "#4F46E5" }}><Layers size={18} /></div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", marginTop: 8 }}>{totalAssignmentsCount}</div>
          <div style={{ fontSize: 12, color: "#4F46E5", marginTop: 4, fontWeight: 600 }}>Active Service Allocations</div>
        </div>

        <div className="card-slds" style={{ padding: 18, background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#64748B" }}>Unique Services</span>
            <div style={{ padding: 8, background: "#F0FDF4", borderRadius: 10, color: "#059669" }}><Sparkles size={18} /></div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", marginTop: 8 }}>{uniqueServicesCount}</div>
          <div style={{ fontSize: 12, color: "#059669", marginTop: 4, fontWeight: 600 }}>Services Offered &amp; Assigned</div>
        </div>

        <div className="card-slds" style={{ padding: 18, background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#64748B" }}>Packages Deployed</span>
            <div style={{ padding: 8, background: "#FFFBEB", borderRadius: 10, color: "#D97706" }}><Package size={18} /></div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", marginTop: 8 }}>{uniquePackagesCount}</div>
          <div style={{ fontSize: 12, color: "#D97706", marginTop: 4, fontWeight: 600 }}>Master Packages Linked</div>
        </div>

        <div className="card-slds" style={{ padding: 18, background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#64748B" }}>Clients Engaged</span>
            <div style={{ padding: 8, background: "#F0F9FF", borderRadius: 10, color: "#0284C7" }}><Users size={18} /></div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", marginTop: 8 }}>{uniqueClientsCount}</div>
          <div style={{ fontSize: 12, color: "#0284C7", marginTop: 4, fontWeight: 600 }}>Unique Client Accounts</div>
        </div>
      </div>

      {/* ─── TOOLBAR & CONTROLS ─── */}
      <div className="data-table-wrapper" style={{ marginBottom: 20 }}>
        <div className="data-table-header" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, padding: "14px 18px" }}>
          {/* Left Controls: Search & Package Filter */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", flex: 1 }}>
            <div className="search-wrapper" style={{ width: 280 }}>
              <Search className="search-icon" />
              <input
                className="search-input"
                placeholder="Search Service, Package, or Client..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Package Filter Dropdown */}
            <select
              className="command-palette-input"
              style={{ width: 190, padding: "6px 10px", fontSize: 12, borderRadius: 8, border: "1px solid #CBD5E1", background: "#FFFFFF" }}
              value={selectedPackageFilter}
              onChange={e => setSelectedPackageFilter(e.target.value)}
            >
              <option value="ALL">All Packages ({services.length})</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
              <option value="One Time Service">One Time Service</option>
            </select>

            {/* Status Filter Buttons */}
            <div style={{ display: "flex", gap: 5 }}>
              {(["ALL", "PENDING", "IN_PROGRESS", "COMPLETED"] as const).map(st => {
                const cfg = st === "ALL" ? { label: "All Status", color: "#4F46E5", bg: "#EEF2FF" } : statusConfig[st];
                const isActive = statusFilter === st;
                return (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    style={{
                      padding: "5px 12px", borderRadius: 20, cursor: "pointer", fontSize: 11.5, fontWeight: 800,
                      background: isActive ? cfg.bg : "#F8FAFC",
                      color: isActive ? cfg.color : "#64748B",
                      border: isActive ? `2px solid ${cfg.color}` : "1px solid #CBD5E1",
                      transition: "all 0.15s",
                    }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right View Tabs Switcher */}
          <div style={{ display: "flex", gap: 6, background: "#F1F5F9", padding: 4, borderRadius: 10 }}>
            <button
              onClick={() => setViewTab("by-service")}
              style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer",
                background: viewTab === "by-service" ? "#0F172A" : "transparent",
                color: viewTab === "by-service" ? "white" : "#64748B",
                border: "none", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s"
              }}
            >
              <Grid size={14} /> View by Service
            </button>
            <button
              onClick={() => setViewTab("by-package")}
              style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer",
                background: viewTab === "by-package" ? "#0F172A" : "transparent",
                color: viewTab === "by-package" ? "white" : "#64748B",
                border: "none", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s"
              }}
            >
              <Package size={14} /> View by Package
            </button>
            <button
              onClick={() => setViewTab("master-table")}
              style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer",
                background: viewTab === "master-table" ? "#0F172A" : "transparent",
                color: viewTab === "master-table" ? "white" : "#64748B",
                border: "none", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s"
              }}
            >
              <List size={14} /> Master Matrix Table
            </button>
          </div>
        </div>
      </div>

      {/* ─── TAB 1: VIEW BY SERVICE (Grouped Cards) ─── */}
      {viewTab === "by-service" && (
        <div style={{ display: "grid", gap: 20 }}>
          {groupedByService.map(group => (
            <div key={group.serviceName} className="card-slds" style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              {/* Service Card Header */}
              <div style={{ padding: "16px 20px", background: "linear-gradient(90deg, #F8FAFC 0%, #EEF2FF 100%)", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: "#4F46E5" }}>{group.serviceName}</span>
                    <span className="chip" style={{ background: "#4F46E5", color: "white", fontWeight: 800, fontSize: 11, padding: "2px 10px", borderRadius: 12 }}>
                      {group.items.length} {group.items.length === 1 ? "Client" : "Clients"} Assigned
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
                    Package: <strong style={{ color: "#0F172A" }}>{group.packageName}</strong>
                  </div>
                </div>

                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>
                  Completed: <span style={{ color: "#059669" }}>{group.items.filter(i => i.status === "COMPLETED").length}</span> / {group.items.length}
                </div>
              </div>

              {/* Clients Table under this Service */}
              <div className="table-scroll-container">
                <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#FFFFFF", color: "#64748B", textTransform: "uppercase", fontSize: 10, fontWeight: 800, borderBottom: "1px solid #F1F5F9" }}>
                      <th style={{ padding: "10px 16px", textAlign: "left", width: 40 }}>#</th>
                      <th style={{ padding: "10px 16px", textAlign: "left" }}>Client Name</th>
                      <th style={{ padding: "10px 16px", textAlign: "left" }}>Package Name</th>
                      <th style={{ padding: "10px 16px", textAlign: "center", width: 110 }}>Financial Year</th>
                      <th style={{ padding: "10px 16px", textAlign: "left", width: 130 }}>Due Date</th>
                      <th style={{ padding: "10px 16px", textAlign: "center", width: 220 }}>Delivery Progress</th>
                      <th style={{ padding: "10px 16px", textAlign: "center", width: 140 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item, idx) => {
                      const phone = item.clientObj?.phone || item.clientObj?.mobile || "";
                      const email = item.clientObj?.email || "";
                      const msgText = `Hello ${item.clientName}, greetings from our office! Update regarding your assigned service *${item.serviceName}* (${item.packageName}).`;

                      return (
                        <tr key={item.key} style={{ borderTop: "1px solid #F1F5F9", background: idx % 2 === 0 ? "#FFFFFF" : "#FAFBFD" }}>
                          <td style={{ padding: "12px 16px", fontWeight: 700, color: "#94A3B8" }}>{idx + 1}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ fontWeight: 800, color: "#0F172A", fontSize: 13 }}>{item.clientName}</div>
                            {phone && <div style={{ fontSize: 11, color: "#0284C7", marginTop: 2 }}>{phone}</div>}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span className="chip" style={{ background: "#F1F5F9", color: "#334155", fontWeight: 700, fontSize: 11 }}>
                              {item.packageName}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "center" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#1D4ED8", background: "#EFF6FF", padding: "2px 8px", borderRadius: 8 }}>
                              {item.financialYear}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            {item.dueDate ? (
                              <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>
                                {formatDate(item.dueDate)}
                              </div>
                            ) : (
                              <span style={{ color: "#94A3B8", fontSize: 11 }}>No due date set</span>
                            )}
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "center" }}>
                            {/* 3 Interactive Status buttons */}
                            <div style={{ display: "inline-flex", gap: 4 }}>
                              {(["PENDING", "IN_PROGRESS", "COMPLETED"] as DeliveryStatus[]).map(st => {
                                const scfg = statusConfig[st];
                                const isActive = item.status === st;
                                return (
                                  <button
                                    key={st}
                                    onClick={() => handleUpdateStatus(item, st)}
                                    style={{
                                      padding: "4px 9px", borderRadius: 14, cursor: "pointer", fontSize: 10.5, fontWeight: 800,
                                      background: isActive ? scfg.bg : "#F8FAFC",
                                      color: isActive ? scfg.color : "#94A3B8",
                                      border: isActive ? `2px solid ${scfg.color}` : "1px solid #E2E8F0",
                                      transition: "all 0.15s",
                                    }}
                                  >
                                    {scfg.label}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "center" }}>
                            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                              {phone && (
                                <a
                                  href={getWhatsAppLink(phone, msgText)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn-slds btn-slds-success"
                                  style={{ padding: "4px 8px", fontSize: 11 }}
                                  title="Send WhatsApp Update"
                                >
                                  <MessageCircle size={13} />
                                  <span>WhatsApp</span>
                                </a>
                              )}
                              {email && (
                                <a
                                  href={`mailto:${email}?subject=${encodeURIComponent(`Update: ${item.serviceName}`)}&body=${encodeURIComponent(msgText)}`}
                                  className="btn-slds btn-slds-secondary"
                                  style={{ padding: "4px 8px", fontSize: 11, color: "#0284C7" }}
                                  title="Send Email"
                                >
                                  <Mail size={13} />
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
          ))}

          {groupedByService.length === 0 && (
            <div style={{ textAlign: "center", padding: 60, background: "#FFFFFF", borderRadius: 16, border: "1px solid #E2E8F0" }}>
              <Layers size={40} color="#CBD5E1" style={{ margin: "0 auto 12px" }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>No service client mappings found</div>
              <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
                Assign packages to clients in the <strong>Assign Packages</strong> section to build your client-service matrix!
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: VIEW BY PACKAGE (Grouped Cards) ─── */}
      {viewTab === "by-package" && (
        <div style={{ display: "grid", gap: 20 }}>
          {groupedByPackage.map(group => (
            <div key={group.packageName} className="card-slds" style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", background: "linear-gradient(90deg, #F8FAFC 0%, #FFFBEB 100%)", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#D97706", display: "flex", alignItems: "center", gap: 8 }}>
                    <Package size={18} /> {group.packageName}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                    Total Assigned Client Mappings: <strong>{group.items.length}</strong>
                  </div>
                </div>
                <span className="chip" style={{ background: "#D97706", color: "white", fontWeight: 800, fontSize: 11, padding: "3px 12px", borderRadius: 12 }}>
                  {group.items.length} Allocations
                </span>
              </div>

              <div className="table-scroll-container">
                <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#FFFFFF", color: "#64748B", textTransform: "uppercase", fontSize: 10, fontWeight: 800, borderBottom: "1px solid #F1F5F9" }}>
                      <th style={{ padding: "10px 16px", textAlign: "left" }}>#</th>
                      <th style={{ padding: "10px 16px", textAlign: "left" }}>Service Name</th>
                      <th style={{ padding: "10px 16px", textAlign: "left" }}>Client Name</th>
                      <th style={{ padding: "10px 16px", textAlign: "center" }}>Financial Year</th>
                      <th style={{ padding: "10px 16px", textAlign: "center" }}>Delivery Status</th>
                      <th style={{ padding: "10px 16px", textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item, idx) => {
                      const phone = item.clientObj?.phone || item.clientObj?.mobile || "";
                      return (
                        <tr key={item.key} style={{ borderTop: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "12px 16px", fontWeight: 700, color: "#94A3B8" }}>{idx + 1}</td>
                          <td style={{ padding: "12px 16px", fontWeight: 800, color: "#4F46E5" }}>{item.serviceName}</td>
                          <td style={{ padding: "12px 16px", fontWeight: 800, color: "#0F172A" }}>{item.clientName}</td>
                          <td style={{ padding: "12px 16px", textAlign: "center" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#1D4ED8", background: "#EFF6FF", padding: "2px 8px", borderRadius: 8 }}>
                              {item.financialYear}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "center" }}>
                            <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 800, background: statusConfig[item.status].bg, color: statusConfig[item.status].color, border: `1px solid ${statusConfig[item.status].border}` }}>
                              {statusConfig[item.status].label}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "center" }}>
                            {phone && (
                              <a
                                href={getWhatsAppLink(phone, `Hello ${item.clientName}, update regarding ${item.serviceName}.`)}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-slds btn-slds-success"
                                style={{ padding: "4px 8px", fontSize: 11 }}
                              >
                                <MessageCircle size={12} /> WhatsApp
                              </a>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── TAB 3: MASTER MATRIX TABLE ─── */}
      {viewTab === "master-table" && (
        <div className="data-table-wrapper">
          <div className="table-scroll-container">
            <table>
              <thead>
                <tr>
                  <th className="col-num">#</th>
                  <th>Service Name</th>
                  <th>Package Name</th>
                  <th>Client Name</th>
                  <th>Financial Year</th>
                  <th>Due Date</th>
                  <th>Delivery Status</th>
                  <th className="col-actions">WhatsApp &amp; Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMappings.map((item, idx) => {
                  const phone = item.clientObj?.phone || item.clientObj?.mobile || "";
                  const msgText = `Hi ${item.clientName}, reminder regarding *${item.serviceName}* (${item.packageName}).`;

                  return (
                    <tr key={item.key}>
                      <td className="col-num">{idx + 1}</td>
                      <td style={{ fontWeight: 800, color: "#4F46E5", fontSize: 13 }}>
                        {item.serviceName}
                      </td>
                      <td>
                        <span className="chip" style={{ background: "#F1F5F9", color: "#334155", fontWeight: 700, fontSize: 11 }}>
                          {item.packageName}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800, color: "#0F172A", fontSize: 13 }}>
                        {item.clientName}
                      </td>
                      <td>
                        <span className="badge" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
                          {item.financialYear}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: "#0F172A", fontSize: 12 }}>
                        {item.dueDate ? formatDate(item.dueDate) : "-"}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          {(["PENDING", "IN_PROGRESS", "COMPLETED"] as DeliveryStatus[]).map(st => {
                            const scfg = statusConfig[st];
                            const isActive = item.status === st;
                            return (
                              <button
                                key={st}
                                onClick={() => handleUpdateStatus(item, st)}
                                style={{
                                  padding: "3px 8px", borderRadius: 12, cursor: "pointer", fontSize: 10, fontWeight: 800,
                                  background: isActive ? scfg.bg : "#F8FAFC",
                                  color: isActive ? scfg.color : "#94A3B8",
                                  border: isActive ? `2px solid ${scfg.color}` : "1px solid #E2E8F0",
                                }}
                              >
                                {scfg.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="col-actions">
                        {phone && (
                          <a
                            href={getWhatsAppLink(phone, msgText)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-slds btn-slds-success"
                            style={{ padding: "4px 10px", fontSize: 11 }}
                            title="Send WhatsApp Message"
                          >
                            <MessageCircle size={13} />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredMappings.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#64748B" }}>
                      No service-client mapping records match your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
}
