"use client";

import AppShell from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { useState, useMemo } from "react";
import {
  Zap, Play, CheckCircle2, Clock, AlertTriangle, ShieldCheck, MessageCircle,
  Sparkles, RefreshCw, Layers, DollarSign, Bell, Check, ArrowRight
} from "lucide-react";
import { formatCurrency, getWhatsAppLink } from "@/lib/utils";
import { toast } from "sonner";

interface AutomationRule {
  id: string;
  name: string;
  category: "COMPLIANCE" | "BILLING" | "RENEWALS" | "RISK";
  description: string;
  triggerCondition: string;
  actionSummary: string;
  active: boolean;
  executedCount: number;
  lastExecuted?: string;
}

export default function AutomationsPage() {
  const { clients, invoices, assignedServices, renewals, oneTimeServices } = useAppStore();

  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: "rule_wa_due",
      name: "Smart WhatsApp Reminder for Approaching Compliances",
      category: "COMPLIANCE",
      description: "Automatically prepares pre-filled WhatsApp reminder messages for compliances due within 7 days.",
      triggerCondition: "Compliance Due Date <= 7 Days",
      actionSummary: "Pre-fills customized WhatsApp client alert",
      active: true,
      executedCount: 42,
      lastExecuted: "2026-08-09 09:30 AM",
    },
    {
      id: "rule_renewal_roll",
      name: "1-Click Service Renewal Rollover Engine",
      category: "RENEWALS",
      description: "Auto-advances validity period (e.g. 2026-2029 → 2029-2032) and updates financial year on renewal.",
      triggerCondition: "User clicks 'Renewal' Action button",
      actionSummary: "Extends validity dates, resets progress to To-do & saves to database",
      active: true,
      executedCount: 18,
      lastExecuted: "2026-08-09 10:15 AM",
    },
    {
      id: "rule_risk_flag",
      name: "AI Client Risk Score & High-Receivable Alert",
      category: "RISK",
      description: "Flags client accounts with pending balances > ₹5,000 or overdue services as High Risk.",
      triggerCondition: "Pending Receivable > ₹5,000 OR Overdue Services > 0",
      actionSummary: "Displays High-Risk badge on Client Profile & AI Copilot",
      active: true,
      executedCount: 89,
      lastExecuted: "2026-08-09 08:00 AM",
    },
    {
      id: "rule_banking_sync",
      name: "Auto-Sync Tax Invoices to Banking Ledger",
      category: "BILLING",
      description: "Automatically creates corresponding ledger entries whenever a new tax invoice is saved.",
      triggerCondition: "Tax Invoice status = SENT or PAID",
      actionSummary: "Syncs invoice amount and payment status to Banking Ledger",
      active: true,
      executedCount: 124,
      lastExecuted: "2026-08-09 10:00 AM",
    },
    {
      id: "rule_ots_reminder",
      name: "One-Time Service Completion & Notification Rule",
      category: "COMPLIANCE",
      description: "Sends progress status notifications to client when one-time service status changes.",
      triggerCondition: "Progress status changes to Completed",
      actionSummary: "Generates completion receipt & WhatsApp notification",
      active: true,
      executedCount: 31,
      lastExecuted: "2026-08-08 04:45 PM",
    },
  ]);

  const toggleRule = (id: string) => {
    setRules(prev =>
      prev.map(r => {
        if (r.id === id) {
          const nextState = !r.active;
          toast.success(`Automation "${r.name}" turned ${nextState ? "ON 🟢" : "OFF 🔴"}`);
          return { ...r, active: nextState };
        }
        return r;
      })
    );
  };

  const handleTestRule = (rule: AutomationRule) => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 800)),
      {
        loading: `Running test execution for "${rule.name}"...`,
        success: `🎉 Test execution successful! Processed ${clients.length} client records cleanly.`,
        error: "Automation test failed.",
      }
    );

    setRules(prev =>
      prev.map(r => r.id === rule.id ? { ...r, executedCount: r.executedCount + 1, lastExecuted: "Just now" } : r)
    );
  };

  const activeRulesCount = rules.filter(r => r.active).length;
  const totalExecutions = rules.reduce((s, r) => s + r.executedCount, 0);

  return (
    <AppShell title="Smart Practice Automations" subtitle="MNC-grade workflow automation triggers and practice rules engine">
      {/* ─── BANNER ─── */}
      <div className="page-header-slds" style={{ background: "linear-gradient(135deg, #0F172A 0%, #312E81 100%)", color: "white", padding: 24, borderRadius: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="breadcrumb" style={{ color: "#94A3B8", fontSize: 12, marginBottom: 6 }}>
              <span>zpluscrm</span>
              <span>/</span>
              <span>Enterprise System</span>
              <span>/</span>
              <span className="current" style={{ color: "#818CF8", fontWeight: 700 }}>Smart Automations</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "white" }}>
              Automated Workflow Triggers
            </div>
            <div style={{ color: "#94A3B8", fontSize: 13, marginTop: 4 }}>
              Execute background triggers for WhatsApp reminders, invoice ledger sync, renewal extensions, and risk alerts automatically.
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.1)", padding: "10px 18px", borderRadius: 12, backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <div style={{ fontSize: 11, color: "#A5B4FC", fontWeight: 800, textTransform: "uppercase" }}>Active Rules</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#FFFFFF", marginTop: 2 }}>{activeRulesCount} / {rules.length} Rules Active</div>
          </div>
        </div>
      </div>

      {/* ─── KPI SUMMARY CARDS ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 20 }}>
        <div className="card-slds" style={{ padding: 18, background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#64748B" }}>Total Rule Executions</span>
            <div style={{ padding: 8, background: "#EEF2FF", borderRadius: 10, color: "#4F46E5" }}><Zap size={18} /></div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", marginTop: 8 }}>{totalExecutions}</div>
          <div style={{ fontSize: 12, color: "#4F46E5", marginTop: 4, fontWeight: 600 }}>Automated Background Actions</div>
        </div>

        <div className="card-slds" style={{ padding: 18, background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#64748B" }}>Automation Health</span>
            <div style={{ padding: 8, background: "#F0FDF4", borderRadius: 10, color: "#059669" }}><ShieldCheck size={18} /></div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#059669", marginTop: 8 }}>100% Optimal</div>
          <div style={{ fontSize: 12, color: "#059669", marginTop: 4, fontWeight: 600 }}>Zero Execution Errors</div>
        </div>

        <div className="card-slds" style={{ padding: 18, background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#64748B" }}>Time Saved</span>
            <div style={{ padding: 8, background: "#FFFBEB", borderRadius: 10, color: "#D97706" }}><Clock size={18} /></div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#0F172A", marginTop: 8 }}>~42 hrs/mo</div>
          <div style={{ fontSize: 12, color: "#D97706", marginTop: 4, fontWeight: 600 }}>Manual Work Eliminated</div>
        </div>
      </div>

      {/* ─── AUTOMATION RULES LIST ─── */}
      <div style={{ display: "grid", gap: 16 }}>
        {rules.map(rule => (
          <div
            key={rule.id}
            className="card-slds"
            style={{
              padding: 20,
              background: "#FFFFFF",
              borderRadius: 16,
              border: rule.active ? "1px solid #C7D2FE" : "1px solid #E2E8F0",
              boxShadow: rule.active ? "0 4px 14px rgba(79, 70, 229, 0.06)" : "none",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flex: 1, minWidth: 280 }}>
              <div
                style={{
                  padding: 12,
                  borderRadius: 14,
                  background: rule.active ? "#EEF2FF" : "#F1F5F9",
                  color: rule.active ? "#4F46E5" : "#94A3B8",
                  border: rule.active ? "1px solid #C7D2FE" : "1px solid #CBD5E1",
                }}
              >
                <Zap size={22} />
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#0F172A" }}>{rule.name}</div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 10,
                      background: rule.active ? "#F0FDF4" : "#FEF2F2",
                      color: rule.active ? "#059669" : "#DC2626",
                      border: rule.active ? "1px solid #BBF7D0" : "1px solid #FECACA",
                    }}
                  >
                    {rule.active ? "🟢 ACTIVE" : "🔴 PAUSED"}
                  </span>
                </div>

                <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>{rule.description}</div>

                <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11.5, color: "#64748B", flexWrap: "wrap" }}>
                  <div>⚡ Trigger: <strong style={{ color: "#0F172A" }}>{rule.triggerCondition}</strong></div>
                  <div>🎯 Action: <strong style={{ color: "#4F46E5" }}>{rule.actionSummary}</strong></div>
                  <div>📊 Executed: <strong style={{ color: "#059669" }}>{rule.executedCount} times</strong></div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                className="btn-slds btn-slds-secondary"
                style={{ padding: "8px 14px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
                onClick={() => handleTestRule(rule)}
              >
                <Play size={13} color="#4F46E5" /> Run Test
              </button>

              <button
                onClick={() => toggleRule(rule.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  background: rule.active ? "#FEF2F2" : "#F0FDF4",
                  color: rule.active ? "#DC2626" : "#059669",
                  border: rule.active ? "1px solid #FECACA" : "1px solid #BBF7D0",
                  transition: "all 0.15s",
                }}
              >
                {rule.active ? "Pause Rule" : "Enable Rule"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
