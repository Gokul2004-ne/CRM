"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import GlobalSearchModal from "@/components/GlobalSearchModal";
import { toast } from "sonner";
import { Lock, Mail, ArrowRight, ArrowLeft, CheckCircle, X } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

type ServiceBlock = {
  code: string;
  label: string;
  description: string;
  active: boolean;
  type: "CA" | "CM" | "CRM" | "CMR";
};

const serviceBlocks: ServiceBlock[] = [
  {
    code: "CA",
    label: "CA Expert",
    description: "Chartered Accountant Practice Management",
    active: false,
    type: "CA"
  },
  {
    code: "CM",
    label: "CM Expert",
    description: "Compliance Management & Regulatory Tracking",
    active: false,
    type: "CM"
  },
  {
    code: "CRM",
    label: "CRM Expert",
    description: "Client Relationship & Practice Management",
    active: true,
    type: "CRM"
  },
  {
    code: "CMR",
    label: "CMR Expert",
    description: "Case Management & Resolution System",
    active: false,
    type: "CMR"
  },
];

// Custom High-Resolution Vector Logos matching exact uploaded user images (Large & Prominent Visibility)
function RenderServiceLogo({ type }: { type: "CA" | "CM" | "CRM" | "CMR" }) {
  if (type === "CA") {
    return (
      <div style={{ width: 96, height: 96, background: "#FFFFFF", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 30px rgba(0,0,0,0.4)", padding: 10 }}>
        <svg viewBox="0 0 200 160" width="80" height="80" fill="none">
          <path d="M 85 25 C 35 25 20 52 20 80 C 20 108 35 135 85 135" stroke="#0A466A" strokeWidth="22" strokeLinecap="round" />
          <path d="M 110 135 L 150 25 L 190 135" stroke="#0A466A" strokeWidth="20" strokeLinejoin="round" strokeLinecap="round" />
          <line x1="155" y1="50" x2="188" y2="135" stroke="#0A466A" strokeWidth="5" />
          <path d="M 92 105 L 122 135 L 205 60" stroke="#66C02E" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  if (type === "CM") {
    return (
      <div style={{ width: 96, height: 96, background: "#FFFFFF", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 30px rgba(0,0,0,0.4)", padding: 10 }}>
        <svg viewBox="0 0 160 160" width="80" height="80" fill="none">
          <path d="M 80 40 L 45 40 C 25 40 15 55 15 80 C 15 105 25 120 45 120 L 80 120" stroke="#00B050" strokeWidth="22" strokeLinecap="round" />
          <path d="M 46 120 L 78 48 C 86 32 96 42 102 62 L 118 112 C 124 122 134 122 140 62 L 146 48" stroke="#1A1A1A" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  if (type === "CRM") {
    return (
      <div style={{ width: 96, height: 96, background: "#FFFFFF", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 16px 36px rgba(79, 70, 229, 0.6)", padding: 8 }}>
        <svg viewBox="0 0 160 160" width="84" height="84">
          <path d="M 80 80 L 80 10 A 70 70 0 0 0 10 80 Z" fill="#2B80BF" />
          <path d="M 80 80 L 150 80 A 70 70 0 0 0 80 10 Z" fill="#54B400" />
          <path d="M 80 80 L 80 150 A 70 70 0 0 0 150 80 Z" fill="#D35400" />
          <path d="M 80 80 L 10 80 A 70 70 0 0 0 80 150 Z" fill="#C0392B" />
          <circle cx="80" cy="80" r="36" fill="#FFFFFF" />
          <text x="80" y="87" textAnchor="middle" fill="#1E293B" fontSize="21" fontWeight="900" fontFamily="sans-serif">CRM</text>
          <circle cx="50" cy="50" r="10" fill="none" stroke="#FFFFFF" strokeWidth="3" />
          <circle cx="50" cy="50" r="4" fill="#FFFFFF" />
          <rect x="100" y="55" width="5" height="12" fill="#FFFFFF" rx="1" />
          <rect x="108" y="48" width="5" height="19" fill="#FFFFFF" rx="1" />
          <rect x="116" y="40" width="5" height="27" fill="#FFFFFF" rx="1" />
          <rect x="98" y="98" width="16" height="12" fill="#FFFFFF" rx="3" />
          <rect x="110" y="106" width="14" height="10" fill="#E67E22" rx="2" />
          <path d="M 40 110 A 10 10 0 0 1 60 110" fill="none" stroke="#FFFFFF" strokeWidth="3" />
          <rect x="38" y="108" width="5" height="8" fill="#FFFFFF" rx="2" />
          <rect x="57" y="108" width="5" height="8" fill="#FFFFFF" rx="2" />
        </svg>
      </div>
    );
  }

  return (
    <div style={{ width: 96, height: 96, background: "#00B4D8", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 30px rgba(0,0,0,0.4)", padding: 8 }}>
      <svg viewBox="0 0 160 160" width="84" height="84">
        <rect x="30" y="85" width="16" height="35" fill="#4B5563" rx="2" />
        <rect x="52" y="70" width="16" height="50" fill="#4B5563" rx="2" />
        <rect x="74" y="60" width="16" height="60" fill="#4B5563" rx="2" />
        <rect x="96" y="50" width="16" height="70" fill="#4B5563" rx="2" />
        <rect x="118" y="40" width="16" height="80" fill="#4B5563" rx="2" />
        <path d="M 25 75 L 68 35 L 90 55 L 132 18 M 110 18 L 132 18 L 132 40" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <text x="80" y="142" textAnchor="middle" fill="#FFFFFF" fontSize="32" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">cmr</text>
      </svg>
    </div>
  );
}

export default function AppShell({ children, title, subtitle }: AppShellProps) {
  const { sidebarCollapsed, loadSupabaseData } = useAppStore();
  const { user, loading, signInWithEmail, signUpWithEmail, resetPasswordForEmail } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Unauthenticated landing state
  const [screen, setScreen] = useState<"landing" | "login">("landing");
  const [comingSoon, setComingSoon] = useState<ServiceBlock | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSupabaseData();
    }
  }, [user, loadSupabaseData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleBlockClick = (block: ServiceBlock) => {
    if (block.active) {
      setScreen("login");
    } else {
      setComingSoon(block);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setInlineError(null);
    try {
      if (authMode === "signin") {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          setInlineError(error.message || "Invalid login credentials");
          toast.error(error.message || "Failed to sign in");
        } else {
          toast.success("Successfully logged in!");
        }
      } else if (authMode === "signup") {
        const { error } = await signUpWithEmail(email, password);
        if (error) {
          setInlineError(error.message || "Failed to create account");
          toast.error(error.message || "Failed to sign up");
        } else {
          toast.success("Account created successfully!");
        }
      } else if (authMode === "forgot") {
        if (!email) {
          setInlineError("Please enter your email address");
          setSubmitting(false);
          return;
        }
        const { error } = await resetPasswordForEmail(email);
        if (error) {
          setInlineError(error.message || "Failed to send reset email");
          toast.error(error.message || "Failed to send reset email");
        } else {
          setResetSent(true);
          toast.success("Password reset email sent!");
        }
      }
    } catch (err: any) {
      setInlineError(err?.message || "An unexpected error occurred");
      toast.error(err?.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#030712",
          color: "#FFFFFF",
        }}
      >
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p style={{ fontSize: "14px", color: "#94A3B8", fontWeight: 500 }}>
          Loading Zplus Practice Workspace...
        </p>
      </div>
    );
  }

  // If unauthenticated, present the 4 Service Selector Landing Screen or Login
  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#030712",
          color: "#FFFFFF",
          padding: "32px 24px",
          position: "relative",
          overflow: "hidden",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Sleek background glowing ambient lights */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "20%",
            width: "600px",
            height: "600px",
            backgroundColor: "rgba(79, 70, 229, 0.12)",
            borderRadius: "50%",
            filter: "blur(140px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            right: "20%",
            width: "600px",
            height: "600px",
            backgroundColor: "rgba(37, 99, 235, 0.12)",
            borderRadius: "50%",
            filter: "blur(140px)",
            pointerEvents: "none",
          }}
        />

        {/* ─── LANDING SCREEN WITH 4 SERVICE BLOCKS ─── */}
        {screen === "landing" && (
          <div style={{ width: "100%", maxWidth: 940, zIndex: 10 }}>
            {/* Header Title with requested Zplus title */}
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <h1
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  color: "#FFFFFF",
                  margin: 0,
                  letterSpacing: "-0.8px",
                  lineHeight: 1.2,
                }}
              >
                Welcome to Zplus Services
              </h1>
              <p style={{ fontSize: 15, color: "#94A3B8", marginTop: 10, fontWeight: 500 }}>
                Select a platform to continue
              </p>
            </div>

            {/* 4 Ultra-Professional Service Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 20,
              }}
            >
              {serviceBlocks.map((block) => (
                <div
                  key={block.code}
                  onClick={() => handleBlockClick(block)}
                  style={{
                    background: block.active
                      ? "linear-gradient(180deg, rgba(79, 70, 229, 0.35) 0%, rgba(30, 27, 75, 0.95) 100%)"
                      : "rgba(15, 23, 42, 0.65)",
                    border: block.active
                      ? "2px solid #6366F1"
                      : "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 24,
                    padding: "36px 20px 28px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    position: "relative",
                    backdropFilter: "blur(16px)",
                    boxShadow: block.active
                      ? "0 20px 50px -10px rgba(79, 70, 229, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)"
                      : "0 10px 30px -10px rgba(0,0,0,0.5)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-8px)";
                    if (!block.active) (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0px)";
                    if (!block.active) (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255, 255, 255, 0.08)";
                  }}
                >
                  {/* Status Badge at Top Right */}
                  {block.active ? (
                    <div
                      style={{
                        position: "absolute",
                        top: 14,
                        right: 14,
                        background: "#54B400",
                        color: "#FFFFFF",
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "3px 10px",
                        borderRadius: 20,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        boxShadow: "0 4px 12px rgba(84, 180, 0, 0.4)",
                      }}
                    >
                      ● ACTIVE
                    </div>
                  ) : (
                    <div
                      style={{
                        position: "absolute",
                        top: 14,
                        right: 14,
                        background: "rgba(255, 255, 255, 0.08)",
                        color: "#94A3B8",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 20,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        border: "1px solid rgba(255,255,255,0.08)"
                      }}
                    >
                      COMING SOON
                    </div>
                  )}

                  {/* Render Custom Vector Logo */}
                  <div style={{ marginBottom: 20 }}>
                    <RenderServiceLogo type={block.type} />
                  </div>

                  {/* Code */}
                  <div
                    style={{
                      fontSize: 30,
                      fontWeight: 900,
                      color: block.active ? "#FFFFFF" : "#64748B",
                      letterSpacing: "-0.5px",
                      lineHeight: 1,
                    }}
                  >
                    {block.code}
                  </div>

                  {/* Label */}
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: block.active ? "#FFFFFF" : "#94A3B8",
                      marginTop: 8,
                    }}
                  >
                    {block.label}
                  </div>

                  {/* Description */}
                  <div
                    style={{
                      fontSize: 12,
                      color: block.active ? "rgba(255,255,255,0.7)" : "#475569",
                      lineHeight: 1.5,
                      marginTop: 10,
                      flex: 1,
                      minHeight: 36
                    }}
                  >
                    {block.description}
                  </div>

                  {/* Action Button on Active Card */}
                  {block.active && (
                    <div
                      style={{
                        marginTop: 20,
                        width: "100%",
                        padding: "10px 0",
                        background: "#6366F1",
                        borderRadius: 14,
                        fontSize: 13,
                        fontWeight: 800,
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        boxShadow: "0 8px 20px -4px rgba(99, 102, 241, 0.6)",
                      }}
                    >
                      Sign In <ArrowRight size={14} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p
              style={{
                textAlign: "center",
                marginTop: 44,
                fontSize: 12.5,
                color: "#475569",
                fontWeight: 500
              }}
            >
              © 2025 zpluscrm • Practice Management Suite
            </p>
          </div>
        )}

        {/* ─── LOGIN FORM ─── */}
        {screen === "login" && (
          <div
            style={{
              width: "100%",
              maxWidth: "480px",
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              backdropFilter: "blur(16px)",
              border: "1px solid #1E293B",
              borderRadius: "24px",
              padding: "32px",
              boxShadow: "0 25px 50px -12px rgba(2, 6, 23, 0.8)",
              zIndex: 10,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setScreen("landing");
                setInlineError(null);
                setAuthMode("signin");
                setEmail("");
                setPassword("");
                setResetSent(false);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#94A3B8",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 20,
                padding: 0,
              }}
            >
              <ArrowLeft size={15} />
              Back to Services
            </button>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              <h1
                style={{
                  fontSize: "26px",
                  fontWeight: 900,
                  letterSpacing: "-0.5px",
                  color: "#FFFFFF",
                  marginBottom: "6px",
                }}
              >
                <span style={{ color: "#FFFFFF" }}>zplus</span>
                <span style={{ color: "#54B400" }}>crm</span>
              </h1>
              <p
                style={{
                  fontSize: "14px",
                  color: "#94A3B8",
                  maxWidth: "360px",
                  margin: 0,
                }}
              >
                {authMode === "signin" && "Sign in to access your practice management workspace"}
                {authMode === "signup" && "Create an account to start managing your firm"}
                {authMode === "forgot" && "Reset your account password via email"}
              </p>
            </div>

            {authMode !== "forgot" && (
              <div
                style={{
                  display: "flex",
                  gap: "4px",
                  marginBottom: "20px",
                  backgroundColor: "#020617",
                  padding: "6px",
                  borderRadius: "16px",
                  border: "1px solid #1E293B",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signin");
                    setInlineError(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "12px 0",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    borderRadius: "12px",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    background:
                      authMode === "signin"
                        ? "linear-gradient(90deg, #2563EB 0%, #4F46E5 100%)"
                        : "transparent",
                    color: authMode === "signin" ? "#FFFFFF" : "#94A3B8",
                    boxShadow:
                      authMode === "signin" ? "0 4px 12px rgba(37, 99, 235, 0.3)" : "none",
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signup");
                    setInlineError(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "12px 0",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    borderRadius: "12px",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    background:
                      authMode === "signup"
                        ? "linear-gradient(90deg, #2563EB 0%, #4F46E5 100%)"
                        : "transparent",
                    color: authMode === "signup" ? "#FFFFFF" : "#94A3B8",
                    boxShadow:
                      authMode === "signup" ? "0 4px 12px rgba(37, 99, 235, 0.3)" : "none",
                  }}
                >
                  Register
                </button>
              </div>
            )}

            {inlineError && (
              <div
                style={{
                  padding: "10px 14px",
                  marginBottom: "16px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#FCA5A5",
                  fontSize: "13px",
                }}
              >
                {inlineError}
              </div>
            )}

            {authMode === "forgot" && resetSent ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <CheckCircle style={{ width: "48px", height: "48px", color: "#10B981", margin: "0 auto 12px" }} />
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF", marginBottom: "8px" }}>
                  Check your inbox
                </h3>
                <p style={{ fontSize: "13.5px", color: "#94A3B8", marginBottom: "20px", lineHeight: "1.5" }}>
                  A password reset link has been sent to your email.
                </p>
                <button
                  type="button"
                  onClick={() => { setAuthMode("signin"); setResetSent(false); }}
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: "#38BDF8",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <ArrowLeft style={{ width: "16px", height: "16px" }} />
                  <span>Back to Sign In</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#CBD5E1",
                      marginBottom: "8px",
                      display: "block",
                    }}
                  >
                    Email Address
                  </label>
                  <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
                    <Mail
                      style={{
                        position: "absolute",
                        left: "12px",
                        width: "20px",
                        height: "20px",
                        color: "#94A3B8",
                        pointerEvents: "none",
                        zIndex: 10,
                      }}
                    />
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: "100%",
                        height: "46px",
                        paddingLeft: "42px",
                        paddingRight: "16px",
                        paddingTop: "10px",
                        paddingBottom: "10px",
                        fontSize: "14px",
                        backgroundColor: "#020617",
                        border: "1px solid #334155",
                        borderRadius: "12px",
                        color: "#FFFFFF",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                {authMode !== "forgot" && (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <label
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#CBD5E1",
                        marginBottom: "8px",
                        display: "block",
                      }}
                    >
                      Password
                    </label>
                    <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
                      <Lock
                        style={{
                          position: "absolute",
                          left: "12px",
                          width: "20px",
                          height: "20px",
                          color: "#94A3B8",
                          pointerEvents: "none",
                          zIndex: 10,
                        }}
                      />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{
                          width: "100%",
                          height: "46px",
                          paddingLeft: "42px",
                          paddingRight: "16px",
                          paddingTop: "10px",
                          paddingBottom: "10px",
                          fontSize: "14px",
                          backgroundColor: "#020617",
                          border: "1px solid #334155",
                          borderRadius: "12px",
                          color: "#FFFFFF",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    {authMode === "signin" && (
                      <div style={{ textAlign: "right", marginTop: "8px" }}>
                        <button
                          type="button"
                          onClick={() => { setAuthMode("forgot"); setInlineError(null); }}
                          style={{
                            background: "none",
                            border: "none",
                            fontSize: "13px",
                            color: "#38BDF8",
                            fontWeight: 500,
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          Forgot Password?
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {authMode === "forgot" && (
                  <div style={{ textAlign: "left" }}>
                    <button
                      type="button"
                      onClick={() => { setAuthMode("signin"); setInlineError(null); }}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "13px",
                        color: "#94A3B8",
                        fontWeight: 500,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <ArrowLeft style={{ width: "14px", height: "14px" }} />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: "100%",
                    height: "48px",
                    padding: "12px 24px",
                    marginTop: "4px",
                    borderRadius: "12px",
                    fontSize: "15px",
                    fontWeight: 600,
                    background: "linear-gradient(90deg, #2563EB 0%, #4F46E5 100%)",
                    color: "#FFFFFF",
                    border: "none",
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.6 : 1,
                    boxShadow: "0 10px 20px -5px rgba(37, 99, 235, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span>
                    {submitting
                      ? "Processing..."
                      : authMode === "signin"
                      ? "Sign In"
                      : authMode === "signup"
                      ? "Create Account"
                      : "Send Reset Link"}
                  </span>
                  {!submitting && <ArrowRight style={{ width: "18px", height: "18px" }} />}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ─── COMING SOON MODAL ─── */}
        {comingSoon && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(2, 6, 23, 0.85)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: 24,
            }}
            onClick={() => setComingSoon(null)}
          >
            <div
              style={{
                background: "rgba(15, 23, 42, 0.98)",
                border: "1px solid #1E293B",
                borderRadius: 24,
                padding: "40px 48px",
                maxWidth: 440,
                textAlign: "center",
                position: "relative",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setComingSoon(null)}
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  color: "#94A3B8",
                  borderRadius: 8,
                  padding: "6px 10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={16} />
              </button>

              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <RenderServiceLogo type={comingSoon.type} />
              </div>

              <div
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: "#FFFFFF",
                  marginBottom: 8,
                }}
              >
                {comingSoon.label}
              </div>

              <div
                style={{
                  display: "inline-block",
                  padding: "6px 18px",
                  background: "rgba(37, 99, 235, 0.2)",
                  border: "1px solid rgba(37, 99, 235, 0.4)",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#60A5FA",
                  marginBottom: 20,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                🚀 Coming Soon
              </div>

              <p
                style={{
                  fontSize: 14,
                  color: "#94A3B8",
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}
              >
                {comingSoon.description} is currently under development. We&apos;re working hard to bring you this feature soon!
              </p>

              <button
                onClick={() => setComingSoon(null)}
                style={{
                  background: "linear-gradient(90deg, #2563EB 0%, #4F46E5 100%)",
                  border: "none",
                  color: "#FFFFFF",
                  padding: "12px 28px",
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Go Back
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If authenticated, render full application layout
  return (
    <div className="app-shell flex h-screen overflow-hidden bg-slate-100">
      <Sidebar />
      <div className={`main-content flex-1 flex flex-col min-w-0 ${sidebarCollapsed ? "collapsed" : ""}`}>
        <Topbar title={title} subtitle={subtitle} onOpenSearch={() => setIsSearchOpen(true)} />
        <main className="content-area flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
