"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import {
  Sparkles, X, Send, Bot, MessageCircle, AlertTriangle, TrendingUp,
  Building2, Calendar, ShieldAlert, CheckCircle2, ArrowRight, Zap, RefreshCw, IndianRupee
} from "lucide-react";
import { formatCurrency, formatDate, getWhatsAppLink } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  actionType?: "whatsapp" | "view_clients" | "view_invoices" | "risk_report";
  actionData?: any;
}

function FormattedMessageText({ text }: { text: string }) {
  if (!text) return null;

  // Clean unescaped literal raw backslashes/quotes
  const sanitized = text.replace(/\\n/g, "\n").replace(/\\"/g, '"');
  const lines = sanitized.split("\n");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {lines.map((line, lIdx) => {
        if (!line.trim()) return <div key={lIdx} style={{ height: 2 }} />;

        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const renderedParts = parts.map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={pIdx} style={{ fontWeight: 800, color: "inherit" }}>{part.slice(2, -2)}</strong>;
          }
          return <span key={pIdx}>{part}</span>;
        });

        const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-");

        return (
          <div key={lIdx} style={{ paddingLeft: isBullet ? 6 : 0, lineHeight: "1.45" }}>
            {renderedParts}
          </div>
        );
      })}
    </div>
  );
}

export default function AiCopilotWidget() {
  const { clients, invoices, assignedServices, oneTimeServices, renewals, services } = useAppStore();

  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m_welcome",
      sender: "ai",
      text: "👋 Hello Practice Manager! I am **zplus AI Copilot**, your MNC-grade Practice Intelligence Engine. How can I assist your practice today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  ]);

  // AI Practice Intelligence Analytics Computation
  const practiceInsights = useMemo(() => {
    const taxInvoices = (invoices || []).filter(i => i.type === "INVOICE");
    const totalBilled = taxInvoices.reduce((s, i) => s + (i.total || 0), 0);
    const totalCollected = taxInvoices.reduce((s, i) => s + (i.amountReceived || 0), 0);
    const totalPending = taxInvoices.reduce((s, i) => s + (i.balanceDue || Math.max(0, (i.total || 0) - (i.amountReceived || 0))), 0);

    // High risk clients (Clients with overdue assigned services or unpaid balance > 0)
    const highRiskClients = (clients || []).map(client => {
      const clientInvoices = taxInvoices.filter(inv => inv.clientId === client.id);
      const pendingBal = clientInvoices.reduce((s, inv) => s + (inv.balanceDue || 0), 0);
      const clientAssigned = (assignedServices || []).filter(a => a.clientId === client.id);
      const overdueServices = clientAssigned.filter(a => a.dueDate && new Date(a.dueDate) < new Date() && a.status !== "COMPLETED");

      let riskScore = 15; // Base risk
      if (pendingBal > 5000) riskScore += 35;
      if (overdueServices.length > 0) riskScore += 40;
      riskScore = Math.min(99, riskScore);

      return {
        client,
        pendingBal,
        overdueServicesCount: overdueServices.length,
        riskScore,
        riskLevel: riskScore >= 70 ? "HIGH" : riskScore >= 40 ? "MODERATE" : "LOW"
      };
    }).sort((a, b) => b.riskScore - a.riskScore);

    const highRiskCount = highRiskClients.filter(c => c.riskLevel === "HIGH").length;

    return {
      totalBilled,
      totalCollected,
      totalPending,
      totalClients: clients.length,
      highRiskClients,
      highRiskCount,
      overdueRenewalsCount: (renewals || []).filter(r => (r.toDate || r.dueDate) && new Date(r.toDate || r.dueDate!) < new Date() && r.progress !== "Completed").length,
    };
  }, [clients, invoices, assignedServices, renewals]);

  const handleSendPrompt = (promptText?: string) => {
    const textToSend = promptText || inputQuery;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: `m_${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!promptText) setInputQuery("");

    // Simulate AI thinking and structured intelligence response
    setTimeout(() => {
      let aiText = "";
      let actionType: Message["actionType"] = undefined;
      let actionData: any = undefined;

      const q = textToSend.toLowerCase();

      if (q.includes("health") || q.includes("audit") || q.includes("practice")) {
        aiText = `📊 **Practice Executive Health Audit**:
• **Active Clients**: ${practiceInsights.totalClients} Accounts
• **Total Tax Invoiced**: ${formatCurrency(practiceInsights.totalBilled)}
• **Collected**: ${formatCurrency(practiceInsights.totalCollected)}
• **Pending Receivables**: ${formatCurrency(practiceInsights.totalPending)}
• **High Risk Clients**: ${practiceInsights.highRiskCount} Accounts requiring immediate attention.
• **Overdue Renewals**: ${practiceInsights.overdueRenewalsCount} Items.`;
        actionType = "risk_report";
      } else if (q.includes("risk") || q.includes("overdue") || q.includes("pending")) {
        const topHighRisk = practiceInsights.highRiskClients.slice(0, 3);
        const listStr = topHighRisk.map(c => `• **${c.client.name}**: Risk Score **${c.riskScore}%** (Pending Bal: ${formatCurrency(c.pendingBal)}, Overdue Services: ${c.overdueServicesCount})`).join("\n");
        aiText = `🚨 **AI Risk Radar Top Alerts**:\n${listStr || "All client accounts are currently within safe operational thresholds! 🎉"}`;
        actionType = "view_clients";
      } else if (q.includes("forecast") || q.includes("revenue") || q.includes("collection")) {
        const projNextMonth = Math.round(practiceInsights.totalBilled * 0.25);
        aiText = `🔮 **AI Revenue & Collection Forecast**:
• **Est. Next Month Collections**: ${formatCurrency(projNextMonth)}
• **Collection Efficiency**: ${practiceInsights.totalBilled > 0 ? Math.round((practiceInsights.totalCollected / practiceInsights.totalBilled) * 100) : 100}%
• **Recommendation**: Trigger automated WhatsApp reminders for outstanding receivables of ${formatCurrency(practiceInsights.totalPending)}.`;
        actionType = "view_invoices";
      } else if (q.includes("whatsapp") || q.includes("reminder") || q.includes("message")) {
        const topClient = practiceInsights.highRiskClients[0]?.client || clients[0];
        if (topClient) {
          const msg = `Dear ${topClient.name}, greetings from our office! This is a friendly reminder regarding your active tax & statutory compliance deadlines. Please submit any pending documents or payment. Thank you!`;
          aiText = `📱 **Generated AI Smart Reminder for ${topClient.name}**:\n*"${msg}"*`;
          actionType = "whatsapp";
          actionData = { phone: topClient.phone || topClient.mobile || "", text: msg };
        } else {
          aiText = "No active clients found to generate reminders.";
        }
      } else {
        aiText = `🤖 I've analyzed your practice database across **${practiceInsights.totalClients} clients**, **${invoices.length} invoices**, and **${assignedServices.length} assigned packages**. 

Key Metrics:
• Total Pending Balances: **${formatCurrency(practiceInsights.totalPending)}**
• Active Renewals Due: **${renewals.length} Items**

Select a prompt below for automated AI execution!`;
      }

      const aiMsg: Message = {
        id: `m_ai_${Date.now()}`,
        sender: "ai",
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actionType,
        actionData,
      };

      setMessages(prev => [...prev, aiMsg]);
    }, 400);
  };

  return (
    <>
      {/* ─── FLOATING TRIGGER BUTTON & CHAT MODAL (DRAGGABLE) ─── */}
      <motion.div
        drag
        dragMomentum={false}
        style={{ position: "fixed", bottom: 20, right: 20, zIndex: 100, cursor: "grab" }}
        whileDrag={{ cursor: "grabbing" }}
      >
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 24,
              background: "linear-gradient(135deg, #0F172A 0%, #4F46E5 100%)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.2)",
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(79, 70, 229, 0.35)",
              fontWeight: 800,
              fontSize: 11.5,
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ position: "relative" }}>
              <Bot size={16} color="#38BDF8" />
              <span style={{ position: "absolute", top: -2, right: -2, width: 6, height: 6, background: "#10B981", borderRadius: "50%", border: "1.5px solid #0F172A" }} />
            </div>
            <span>zplus AI Copilot</span>
            <Sparkles size={13} color="#F59E0B" />
          </button>
        ) : (
          /* ─── COMPACT AI CHAT PANEL POPUP ─── */
          <div
            style={{
              width: 320,
              maxWidth: "88vw",
              height: 400,
              maxHeight: "65vh",
              background: "#FFFFFF",
              borderRadius: 14,
              boxShadow: "0 12px 36px rgba(15, 23, 42, 0.3)",
              border: "1px solid #CBD5E1",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              animation: "fadeIn 0.2s ease-in-out",
            }}
          >
            {/* AI Panel Header (Draggable Handle) */}
            <div style={{ padding: "10px 12px", background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "move" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ padding: 5, background: "rgba(56, 189, 248, 0.15)", borderRadius: 8, border: "1px solid rgba(56, 189, 248, 0.3)" }}>
                  <Bot size={16} color="#38BDF8" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>
                    zplus AI Copilot <span style={{ fontSize: 8.5, background: "#4F46E5", padding: "1px 4px", borderRadius: 5, textTransform: "uppercase" }}>v4.0</span>
                  </div>
                  <div style={{ fontSize: 9.5, color: "#94A3B8" }}>Practice Intelligence Engine</div>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", padding: 4, borderRadius: 5, cursor: "pointer" }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Quick Prompt Pills */}
            <div style={{ padding: "8px 12px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", display: "flex", gap: 6, overflowX: "auto", whiteSpace: "nowrap" }}>
              <button
                onClick={() => handleSendPrompt("Practice Health Audit")}
                style={{ padding: "4px 8px", borderRadius: 12, fontSize: 10.5, fontWeight: 700, background: "#EEF2FF", color: "#4F46E5", border: "1px solid #C7D2FE", cursor: "pointer" }}
              >
                📊 Health Audit
              </button>
              <button
                onClick={() => handleSendPrompt("High Risk Overdue Clients")}
                style={{ padding: "4px 8px", borderRadius: 12, fontSize: 10.5, fontWeight: 700, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", cursor: "pointer" }}
              >
                🚨 Risk Radar
              </button>
              <button
                onClick={() => handleSendPrompt("Revenue Forecast")}
                style={{ padding: "4px 8px", borderRadius: 12, fontSize: 10.5, fontWeight: 700, background: "#F0FDF4", color: "#059669", border: "1px solid #BBF7D0", cursor: "pointer" }}
              >
                💰 Revenue Forecast
              </button>
              <button
                onClick={() => handleSendPrompt("Generate WhatsApp Reminder")}
                style={{ padding: "4px 8px", borderRadius: 12, fontSize: 10.5, fontWeight: 700, background: "#ECFDF5", color: "#047857", border: "1px solid #A7F3D0", cursor: "pointer" }}
              >
                📱 WhatsApp Draft
              </button>
            </div>

            {/* Chat Body */}
            <div style={{ flex: 1, padding: 14, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, background: "#FAFBFD" }}>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                    maxWidth: "88%",
                    background: msg.sender === "user" ? "#4F46E5" : "#FFFFFF",
                    color: msg.sender === "user" ? "white" : "#0F172A",
                    padding: "9px 12px",
                    borderRadius: msg.sender === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                    border: msg.sender === "ai" ? "1px solid #E2E8F0" : "none",
                    fontSize: 12,
                    lineHeight: "1.45",
                  }}
                >
                  <FormattedMessageText text={msg.text} />

                  {/* Dynamic Action Buttons */}
                  {msg.actionType === "whatsapp" && msg.actionData && (
                    <div style={{ marginTop: 8 }}>
                      <a
                        href={getWhatsAppLink(msg.actionData.phone, msg.actionData.text)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-slds btn-slds-success"
                        style={{ padding: "4px 10px", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 5 }}
                      >
                        <MessageCircle size={13} /> Send WhatsApp Now
                      </a>
                    </div>
                  )}

                  <div style={{ fontSize: 9, opacity: 0.6, marginTop: 4, textAlign: "right" }}>{msg.timestamp}</div>
                </div>
              ))}
            </div>

            {/* Chat Input Bar */}
            <div style={{ padding: 10, background: "#FFFFFF", borderTop: "1px solid #E2E8F0", display: "flex", gap: 6, alignItems: "center" }}>
              <input
                className="command-palette-input"
                style={{ flex: 1, padding: "7px 12px", fontSize: 12, borderRadius: 18, border: "1px solid #CBD5E1" }}
                placeholder="Ask AI anything about your practice..."
                value={inputQuery}
                onChange={e => setInputQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSendPrompt(); }}
              />
              <button
                onClick={() => handleSendPrompt()}
                style={{ background: "#4F46E5", border: "none", color: "white", padding: 7, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}
