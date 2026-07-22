"use client";
import AppShell from "@/components/AppShell";
import { CreditCard, CheckCircle2, Calendar, Zap, Users, Briefcase, FileText, User } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "₹2,999",
    period: "/year",
    accent: "#E8520A",
    bgAccent: "#FFFAF8",
    cta: "Switch to Starter",
    ctaDisabled: false,
    features: [
      "Up to 25 Clients",
      "5 Services",
      "Basic Reports",
      "WhatsApp Integration",
      "Email Support",
    ],
    current: false,
  },
  {
    name: "Professional",
    price: "₹6,999",
    period: "/year",
    accent: "#1A237E",
    bgAccent: "#F0F4FF",
    cta: "Current Plan",
    ctaDisabled: true,
    features: [
      "Unlimited Clients",
      "Unlimited Services",
      "Advanced Reports",
      "WhatsApp Integration",
      "Banking Module",
      "Document Drafts",
      "Priority Support",
    ],
    current: true,
  },
  {
    name: "Enterprise",
    price: "₹14,999",
    period: "/year",
    accent: "#059669",
    bgAccent: "#F0FDF9",
    cta: "Upgrade to Enterprise",
    ctaDisabled: false,
    features: [
      "Everything in Pro",
      "Multi-User Access",
      "Custom Branding",
      "API Access",
      "Dedicated Manager",
      "Custom Integrations",
      "SLA Support",
    ],
    current: false,
  },
];

const usageStats = [
  { label: "Clients", used: 5, max: "∞", Icon: Users,    color: "#1A237E", bg: "#EEF2FF" },
  { label: "Services", used: 6, max: "∞", Icon: Briefcase, color: "#E8520A", bg: "#FFF7F5" },
  { label: "Drafts",   used: 2, max: "∞", Icon: FileText,  color: "#059669", bg: "#ECFDF5" },
  { label: "Users",    used: 1, max: "5",  Icon: User,      color: "#D97706", bg: "#FFFBEB" },
];

export default function SubscriptionPage() {
  const renewalDate = "31 March 2026";
  const daysLeft = 253;
  const pctElapsed = Math.round(((365 - daysLeft) / 365) * 100);

  return (
    <AppShell title="Subscription & Plans" subtitle="Manage your CRMExpert subscription and billing">

      {/* ── Current Plan Banner ── */}
      <div style={{
        background: "linear-gradient(135deg, #1A237E 0%, #3949AB 60%, #5C6BC0 100%)",
        borderRadius: 16,
        padding: "28px 32px",
        marginBottom: 28,
        boxShadow: "0 8px 32px rgba(26,35,126,0.22)",
      }}>

        {/* Title row + action buttons */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 6 }}>
              Current Plan
            </div>
            <div style={{ color: "white", fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 10 }}>
              Professional Plan
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
              <Calendar size={14} />
              <span>Renews on {renewalDate}</span>
              <span style={{ background: "rgba(255,255,255,0.18)", borderRadius: 20, padding: "2px 12px", fontWeight: 700, fontSize: 12, color: "white" }}>
                {daysLeft} days left
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexShrink: 0, alignItems: "flex-start", marginTop: 4 }}>
            <button style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer",
              background: "rgba(255,255,255,0.14)", color: "white",
              fontSize: 13, fontWeight: 600,
            }}>
              <CreditCard size={14} /> Manage Billing
            </button>
            <button style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer",
              background: "white", color: "#1A237E",
              fontSize: 13, fontWeight: 700,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}>
              <Zap size={14} /> Upgrade to Enterprise
            </button>
          </div>
        </div>

        {/* Subscription Usage progress bar */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 600 }}>Subscription Usage</span>
            <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>{pctElapsed}% elapsed</span>
          </div>

          {/* Track */}
          <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 12, height: 10, overflow: "hidden", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.12)" }}>
            {/* Fill */}
            <div style={{
              height: "100%",
              width: `${pctElapsed}%`,
              background: "linear-gradient(90deg, rgba(255,255,255,0.85) 0%, white 100%)",
              borderRadius: 12,
              boxShadow: "0 0 6px rgba(255,255,255,0.45)",
            }} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>1 April 2025</span>
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>31 March 2026</span>
          </div>
        </div>
      </div>

      {/* ── Pricing Cards ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 24,
        alignItems: "stretch",
        marginBottom: 28,
      }}>
        {plans.map((plan) => (
          <div key={plan.name} style={{
            display: "flex",
            flexDirection: "column",
            position: "relative",
            background: plan.current ? plan.bgAccent : "white",
            border: plan.current ? `2px solid ${plan.accent}` : "1.5px solid #E2E8F0",
            borderRadius: 16,
            padding: "28px 24px 24px",
            boxShadow: plan.current
              ? `0 8px 28px ${plan.accent}26, 0 2px 8px rgba(0,0,0,0.05)`
              : "0 1px 4px rgba(15,23,42,0.05)",
          }}>

            {/* "Current Plan" badge */}
            {plan.current && (
              <div style={{
                position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                background: plan.accent, color: "white",
                borderRadius: 20, padding: "4px 16px",
                fontSize: 11, fontWeight: 800, whiteSpace: "nowrap",
                letterSpacing: "0.3px", boxShadow: `0 2px 8px ${plan.accent}50`,
              }}>
                ✓ Current Plan
              </div>
            )}

            {/* Plan name */}
            <div style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", marginBottom: 10 }}>
              {plan.name}
            </div>

            {/* Price */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 20 }}>
              <span style={{ fontSize: 30, fontWeight: 800, color: plan.accent, lineHeight: 1 }}>
                {plan.price}
              </span>
              <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>
                {plan.period}
              </span>
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid #E2E8F0", marginBottom: 18 }} />

            {/* Feature list – flex:1 so it fills available space */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {plan.features.map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <CheckCircle2 size={16} style={{ flexShrink: 0, color: plan.accent }} />
                  <span style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.3 }}>{f}</span>
                </div>
              ))}
            </div>

            {/* CTA pinned to bottom */}
            <button
              disabled={plan.ctaDisabled}
              style={{
                width: "100%",
                padding: "11px 0",
                borderRadius: 10,
                border: plan.current ? "none" : `1.5px solid ${plan.accent}`,
                cursor: plan.ctaDisabled ? "default" : "pointer",
                fontSize: 13.5,
                fontWeight: 700,
                background: plan.current ? plan.accent : "white",
                color: plan.current ? "white" : plan.accent,
                boxShadow: plan.current ? `0 2px 8px ${plan.accent}30` : "none",
                opacity: plan.ctaDisabled ? 0.9 : 1,
                transition: "all 0.15s ease",
              }}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* ── Usage Stats Row ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 16,
      }}>
        {usageStats.map(({ label, used, max, Icon, color, bg }) => (
          <div key={label} style={{
            background: "white",
            border: "1.5px solid #E2E8F0",
            borderRadius: 14,
            padding: "18px 20px",
            boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                {label} Used
              </span>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={16} color={color} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: "#0F172A" }}>{used}</span>
              <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>/ {max}</span>
            </div>
          </div>
        ))}
      </div>

    </AppShell>
  );
}
