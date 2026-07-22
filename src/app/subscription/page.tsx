"use client";
import AppShell from "@/components/AppShell";
import { CreditCard, CheckCircle, Calendar, Zap } from "lucide-react";

const plans = [
  {
    name: "Starter", price: "₹2,999", period: "/year", color: "#E8520A",
    features: ["Up to 25 Clients", "5 Services", "Basic Reports", "WhatsApp Integration", "Email Support"],
    current: false,
  },
  {
    name: "Professional", price: "₹6,999", period: "/year", color: "#1A237E",
    features: ["Unlimited Clients", "Unlimited Services", "Advanced Reports", "WhatsApp Integration", "Banking Module", "Document Drafts", "Priority Support"],
    current: true,
  },
  {
    name: "Enterprise", price: "₹14,999", period: "/year", color: "#059669",
    features: ["Everything in Pro", "Multi-User Access", "Custom Branding", "API Access", "Dedicated Manager", "Custom Integrations", "SLA Support"],
    current: false,
  },
];

export default function SubscriptionPage() {
  const renewalDate = "31 March 2026";
  const daysLeft = 253;

  return (
    <AppShell title="Subscription Details" subtitle="Manage your CMAExpert subscription plan">
      {/* Current Plan Banner */}
      <div className="section-card" style={{ background: "linear-gradient(135deg, #1A237E, #3949AB)", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Current Plan</div>
            <div style={{ color: "white", fontSize: 26, fontWeight: 800, marginTop: 4 }}>Professional Plan</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <Calendar size={14} /> Renews on {renewalDate}
              <span style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "2px 10px", fontWeight: 700 }}>
                {daysLeft} days left
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
              <CreditCard size={14} /> Manage Billing
            </button>
            <button className="btn" style={{ background: "white", color: "#1A237E", fontWeight: 700 }}>
              <Zap size={14} /> Upgrade to Enterprise
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Subscription Usage</span>
            <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>{Math.round((365 - daysLeft) / 365 * 100)}% elapsed</span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, height: 8 }}>
            <div style={{ background: "white", borderRadius: 10, height: 8, width: `${(365 - daysLeft) / 365 * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid-3">
        {plans.map(plan => (
          <div key={plan.name} className="section-card" style={{
            border: plan.current ? `2px solid ${plan.color}` : "2px solid transparent",
            position: "relative",
            transition: "all 0.2s"
          }}>
            {plan.current && (
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: plan.color, color: "white", borderRadius: 20, padding: "3px 14px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                ✓ Current Plan
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>{plan.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginTop: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: plan.color }}>{plan.price}</span>
                <span style={{ fontSize: 13, color: "#94A3B8" }}>{plan.period}</span>
              </div>
            </div>
            <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 16, marginBottom: 20 }}>
              {plan.features.map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <CheckCircle size={15} color={plan.color} />
                  <span style={{ fontSize: 13, color: "#374151" }}>{f}</span>
                </div>
              ))}
            </div>
            <button className="btn" style={{
              width: "100%", justifyContent: "center",
              background: plan.current ? plan.color : "#F1F5F9",
              color: plan.current ? "white" : "#374151",
            }}>
              {plan.current ? "Current Plan" : "Switch to " + plan.name}
            </button>
          </div>
        ))}
      </div>

      {/* Usage Stats */}
      <div className="grid-4" style={{ marginTop: 20 }}>
        {[
          { label: "Clients", used: 5, max: "Unlimited", color: "#1A237E" },
          { label: "Services", used: 6, max: "Unlimited", color: "#E8520A" },
          { label: "Drafts", used: 2, max: "Unlimited", color: "#059669" },
          { label: "Users", used: 1, max: 5, color: "#D97706" },
        ].map(u => (
          <div key={u.label} className="stat-card">
            <div className="stat-label">{u.label} Used</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>{u.used} <span style={{ fontSize: 14, color: "#94A3B8", fontWeight: 400 }}>/ {u.max}</span></div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
