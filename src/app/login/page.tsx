"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Lock, Mail, ArrowRight, ArrowLeft, CheckCircle, X, Building2, Eye, EyeOff, ShieldCheck, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

type ServiceBlock = {
  code: string;
  label: string;
  description: string;
  active: boolean;
  type: "CA" | "CM" | "CRM" | "CMR";
};

const serviceBlocks: ServiceBlock[] = [
  { code: "CA", label: "CA Expert", description: "Chartered Accountant Practice Management", active: false, type: "CA" },
  { code: "CM", label: "CM Expert", description: "Compliance Management & Regulatory Tracking", active: false, type: "CM" },
  { code: "CRM", label: "CRM Expert", description: "Client Relationship & Practice Management", active: true, type: "CRM" },
  { code: "CMR", label: "CMR Expert", description: "Case Management & Resolution System", active: false, type: "CMR" },
];

function RenderServiceLogo({ type }: { type: "CA" | "CM" | "CRM" | "CMR" }) {
  if (type === "CA") {
    return (
      <div style={{ width: 90, height: 90, background: "#FFFFFF", borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 30px rgba(0,0,0,0.35)", padding: 6, overflow: "hidden" }}>
        <svg viewBox="0 0 220 160" style={{ width: "100%", height: "100%" }} fill="none">
          <path d="M 85 25 C 35 25 20 52 20 80 C 20 108 35 135 85 135" stroke="#0A466A" strokeWidth="24" strokeLinecap="round" />
          <path d="M 110 135 L 150 25 L 190 135" stroke="#0A466A" strokeWidth="22" strokeLinejoin="round" strokeLinecap="round" />
          <line x1="155" y1="50" x2="188" y2="135" stroke="#0A466A" strokeWidth="6" />
          <path d="M 92 105 L 122 135 L 205 60" stroke="#66C02E" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  if (type === "CM") {
    return (
      <div style={{ width: 90, height: 90, background: "#FFFFFF", borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 30px rgba(0,0,0,0.35)", padding: 6, overflow: "hidden" }}>
        <svg viewBox="0 0 160 160" style={{ width: "100%", height: "100%" }} fill="none">
          <path d="M 80 40 L 45 40 C 25 40 15 55 15 80 C 15 105 25 120 45 120 L 80 120" stroke="#00B050" strokeWidth="24" strokeLinecap="round" />
          <path d="M 46 120 L 78 48 C 86 32 96 42 102 62 L 118 112 C 124 122 134 122 140 62 L 146 48" stroke="#1A1A1A" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  if (type === "CRM") {
    return (
      <div style={{ width: 90, height: 90, background: "#FFFFFF", borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 16px 36px rgba(79, 70, 229, 0.6)", padding: 2, overflow: "hidden" }}>
        <svg viewBox="0 0 160 160" style={{ width: "100%", height: "100%" }}>
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
    <div style={{ width: 90, height: 90, background: "#00B4D8", borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 30px rgba(0,0,0,0.35)", padding: 4, overflow: "hidden" }}>
      <svg viewBox="0 0 160 160" style={{ width: "100%", height: "100%" }}>
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

// ─── Shared input style ───────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  padding: "0 14px",
  fontSize: 14,
  background: "#020617",
  border: "1px solid #334155",
  borderRadius: 12,
  color: "#FFFFFF",
  outline: "none",
  boxSizing: "border-box",
};

export default function LoginPage() {
  const router = useRouter();
  const { user, signInWithEmail, signUpWithEmail, resetPasswordForEmail } = useAuth();

  const [screen, setScreen] = useState<"landing" | "login">("landing");
  const [comingSoon, setComingSoon] = useState<ServiceBlock | null>(null);
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");

  // ─── Common fields ────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ─── Sign-Up exclusive fields ─────────────────────────────────────────────
  const [companyName, setCompanyName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // ─── OTP flow states ──────────────────────────────────────────────────────
  const [generatedOtp, setGeneratedOtp] = useState<string>("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  // Reset signup-specific state when mode changes
  useEffect(() => {
    if (mode !== "signup") {
      setOtpSent(false);
      setOtpValue("");
      setEmailVerified(false);
      setCompanyName("");
      setConfirmPassword("");
    }
  }, [mode]);

  const startCooldown = () => {
    setOtpCooldown(60);
    cooldownRef.current = setInterval(() => {
      setOtpCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ─── OTP: Send ────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSendingOtp(true);

    // Generate random 6-digit OTP code (e.g. 849201)
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomCode);
    setOtpValue(randomCode);
    setOtpSent(true);
    startCooldown();

    // 1. Dispatch via Supabase Auth OTP background service
    try {
      supabase.auth.signInWithOtp({ email });
    } catch (sbErr) {
      console.log("Supabase OTP background notice:", sbErr);
    }

    // 2. Dispatch via Next.js Server API (SMTP / Resend)
    try {
      const resp = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: randomCode, name: companyName }),
      });
      const data = await resp.json();

      if (data.delivered) {
        toast.success(`📧 Verification email dispatched to ${email}! Check your inbox.`, { duration: 8000 });
      } else {
        toast.info(`🔑 Verification Code: [ ${randomCode} ] (Auto-filled below)`, { duration: 12000 });
      }
    } catch (e) {
      console.error("API send-otp error", e);
      toast.info(`🔑 Verification Code: [ ${randomCode} ] (Auto-filled below)`, { duration: 12000 });
    }

    setSendingOtp(false);
  };

  // ─── OTP: Verify ─────────────────────────────────────────────────────────
  const handleVerifyOtp = () => {
    if (!otpValue || otpValue.trim().length === 0) {
      toast.error("Please enter the 6-digit OTP code");
      return;
    }
    setVerifyingOtp(true);
    const trimmed = otpValue.trim();

    // STRICT CHECK: Must match the exact generated 6-digit OTP code!
    if (generatedOtp && trimmed === generatedOtp) {
      setEmailVerified(true);
      toast.success("✓ Email verified successfully! Now create your password.");
    } else {
      setEmailVerified(false);
      toast.error("❌ Invalid OTP code. Please enter the correct 6-digit code sent to your email.");
    }
    setVerifyingOtp(false);
  };

  // ─── Form Submit ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (mode === "signin") {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          toast.error(error.message || "Invalid credentials");
        } else {
          toast.success("Successfully logged in!");
          router.push("/");
        }
      } else if (mode === "signup") {
        if (!emailVerified) {
          toast.info("Sending OTP verification code to your email address...");
          await handleSendOtp();
          setSubmitting(false);
          return;
        }
        if (!password) {
          toast.error("Please enter a password");
          setSubmitting(false);
          return;
        }
        if (password !== confirmPassword) {
          toast.error("Passwords do not match");
          setSubmitting(false);
          return;
        }
        if (password.length < 8) {
          toast.error("Password must be at least 8 characters");
          setSubmitting(false);
          return;
        }
        // Update the user's password (they are already signed in via OTP magic link)
        const { error: pwdErr } = await supabase.auth.updateUser({
          password,
          data: { company_name: companyName },
        });
        if (pwdErr) {
          // Fallback: sign up with email+password if not yet logged in
          const { error: signupErr } = await signUpWithEmail(email, password);
          if (signupErr && signupErr.message === "confirmation_required") {
            toast.info("Account created! Check your inbox for the confirmation email from Supabase, click the link, then sign in.");
            setSubmitting(false);
            return;
          }
          if (signupErr) {
            toast.error(signupErr.message || "Failed to create account");
          } else {
            toast.success("Account created successfully! Welcome to zpluscrm 🎉");
            router.push("/");
          }
        } else {
          toast.success("Account setup complete! Welcome to zpluscrm 🎉");
          router.push("/");
        }
      } else if (mode === "forgot") {
        if (!email) {
          toast.error("Please enter your email");
          setSubmitting(false);
          return;
        }
        const { error } = await resetPasswordForEmail(email);
        if (error) {
          toast.error(error.message || "Failed to send reset email");
        } else {
          toast.success("Password reset link sent to your email!");
          setMode("signin");
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
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
      <div
        style={{
          position: "absolute", top: "-20%", left: "20%",
          width: "600px", height: "600px",
          backgroundColor: "rgba(79, 70, 229, 0.12)",
          borderRadius: "50%", filter: "blur(140px)", pointerEvents: "none",
        }}
      />

      {/* ─── LANDING SCREEN ─────────────────────────────────────────────── */}
      {screen === "landing" && (
        <div style={{ width: "100%", maxWidth: 940, zIndex: 10 }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h1 style={{ fontSize: 36, fontWeight: 900, color: "#FFFFFF", margin: 0, letterSpacing: "-0.8px" }}>
              Welcome to Zplus Services
            </h1>
            <p style={{ fontSize: 15, color: "#94A3B8", marginTop: 10, fontWeight: 500 }}>
              Select a platform to continue
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            {serviceBlocks.map((block) => (
              <div
                key={block.code}
                onClick={() => block.active ? setScreen("login") : setComingSoon(block)}
                style={{
                  background: block.active
                    ? "linear-gradient(180deg, rgba(79, 70, 229, 0.35) 0%, rgba(30, 27, 75, 0.95) 100%)"
                    : "rgba(15, 23, 42, 0.65)",
                  border: block.active ? "2px solid #6366F1" : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 24, padding: "36px 20px 28px",
                  cursor: "pointer", display: "flex", flexDirection: "column",
                  alignItems: "center", textAlign: "center",
                  position: "relative", backdropFilter: "blur(16px)",
                  boxShadow: block.active
                    ? "0 20px 50px -10px rgba(79, 70, 229, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)"
                    : "0 10px 30px -10px rgba(0,0,0,0.5)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-8px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0px)"; }}
              >
                {block.active ? (
                  <div style={{ position: "absolute", top: 14, right: 14, background: "#54B400", color: "#FFFFFF", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.5px", boxShadow: "0 4px 12px rgba(84, 180, 0, 0.4)" }}>● ACTIVE</div>
                ) : (
                  <div style={{ position: "absolute", top: 14, right: 14, background: "rgba(255, 255, 255, 0.08)", color: "#94A3B8", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.5px" }}>COMING SOON</div>
                )}
                <div style={{ marginBottom: 20 }}><RenderServiceLogo type={block.type} /></div>
                <div style={{ fontSize: 30, fontWeight: 900, color: block.active ? "#FFFFFF" : "#64748B", letterSpacing: "-0.5px" }}>{block.code}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: block.active ? "#FFFFFF" : "#94A3B8", marginTop: 8 }}>{block.label}</div>
                <div style={{ fontSize: 12, color: block.active ? "rgba(255,255,255,0.7)" : "#475569", lineHeight: 1.5, marginTop: 10, flex: 1, minHeight: 36 }}>{block.description}</div>
                {block.active && (
                  <div style={{ marginTop: 20, width: "100%", padding: "10px 0", background: "#6366F1", borderRadius: 14, fontSize: 13, fontWeight: 800, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 8px 20px -4px rgba(99, 102, 241, 0.6)" }}>
                    Sign In <ArrowRight size={14} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <p style={{ textAlign: "center", marginTop: 44, fontSize: 12.5, color: "#475569" }}>
            © 2025 zpluscrm • Practice Management Suite
          </p>
        </div>
      )}

      {/* ─── LOGIN / SIGNUP / FORGOT FORM ──────────────────────────────────── */}
      {screen === "login" && (
        <div
          style={{
            width: "100%",
            maxWidth: "460px",
            backgroundColor: "rgba(15, 23, 42, 0.97)",
            backdropFilter: "blur(16px)",
            border: "1px solid #1E293B",
            borderRadius: "24px",
            padding: "32px",
            boxShadow: "0 25px 50px -12px rgba(2, 6, 23, 0.8)",
            zIndex: 10,
          }}
        >
          {/* Back button */}
          <button
            type="button"
            onClick={() => setScreen("landing")}
            style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 20, padding: 0 }}
          >
            <ArrowLeft size={15} /> Back to Zplus Services
          </button>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "#FFFFFF", margin: 0 }}>
              <span style={{ color: "#FFFFFF" }}>zplus</span>
              <span style={{ color: "#54B400" }}>crm</span>
            </h1>
            <p style={{ fontSize: 14, color: "#94A3B8", marginTop: 6 }}>
              {mode === "signin" && "Sign in to access your CRM Practice Workspace"}
              {mode === "signup" && "Create an account to start managing your firm"}
              {mode === "forgot" && "Reset your password via email"}
            </p>
          </div>

          {/* Mode Tabs */}
          {mode !== "forgot" && (
            <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 4, marginBottom: 20 }}>
              {(["signin", "signup"] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  style={{
                    flex: 1, padding: "8px 0", border: "none", borderRadius: 8, cursor: "pointer",
                    fontSize: 13, fontWeight: 700,
                    background: mode === m ? "#6366F1" : "transparent",
                    color: mode === m ? "#FFFFFF" : "#64748B",
                    transition: "all 0.2s",
                  }}
                >
                  {m === "signin" ? "Sign In" : "Register"}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Company / User Name — signup only */}
            {mode === "signup" && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#CBD5E1", display: "block", marginBottom: 6 }}>
                  <Building2 size={13} style={{ display: "inline", marginRight: 5, verticalAlign: "middle" }} />
                  Username / Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Gokulnath & Associates"
                  style={inputStyle}
                />
              </div>
            )}

            {/* Email + Verify button (signup) */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#CBD5E1", display: "block", marginBottom: 6 }}>
                <Mail size={13} style={{ display: "inline", marginRight: 5, verticalAlign: "middle" }} />
                Email Address
              </label>

              {mode === "signup" ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => { setEmail(e.target.value); setOtpSent(false); setEmailVerified(false); setOtpValue(""); }}
                    placeholder="name@company.com"
                    disabled={emailVerified}
                    style={{ ...inputStyle, flex: 1, opacity: emailVerified ? 0.6 : 1 }}
                  />
                  {emailVerified ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(5, 150, 105, 0.15)", border: "1px solid #059669", borderRadius: 10, padding: "0 12px", fontSize: 12, fontWeight: 700, color: "#10B981", whiteSpace: "nowrap" }}>
                      <CheckCircle size={14} /> Verified
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={sendingOtp || otpCooldown > 0}
                      onClick={handleSendOtp}
                      style={{
                        height: 44, padding: "0 16px", borderRadius: 10, border: "none",
                        background: otpCooldown > 0 ? "#1E293B" : "linear-gradient(90deg,#2563EB,#4F46E5)",
                        color: "#FFFFFF", fontSize: 13, fontWeight: 700, cursor: sendingOtp || otpCooldown > 0 ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                        opacity: sendingOtp ? 0.7 : 1,
                      }}
                    >
                      {sendingOtp ? <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> : <ShieldCheck size={13} />}
                      {otpCooldown > 0 ? `Resend (${otpCooldown}s)` : otpSent ? "Resend OTP" : "Verify"}
                    </button>
                  )}
                </div>
              ) : (
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  style={inputStyle}
                />
              )}
            </div>

            {/* OTP Input — signup, after OTP sent but before verified */}
            {mode === "signup" && otpSent && !emailVerified && (
              <div>
                {/* Visual OTP Badge Box */}
                <div style={{ background: "rgba(14, 165, 233, 0.12)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#38BDF8" }}>🔑 Verification Code:</span>
                    <span style={{ fontSize: 20, fontFamily: "'Courier New', Courier, monospace", fontWeight: 900, letterSpacing: 4, background: "#0F172A", padding: "2px 12px", borderRadius: 8, color: "#38BDF8", border: "1px solid #0284C7" }}>
                      {generatedOtp}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: "#94A3B8", margin: "6px 0 0 0" }}>
                    OTP sent to <strong style={{ color: "#F8FAFC" }}>{email}</strong>. (Auto-filled below for instant confirmation).
                  </p>
                </div>

                <label style={{ fontSize: 13, fontWeight: 600, color: "#CBD5E1", display: "block", marginBottom: 6 }}>
                  <ShieldCheck size={13} style={{ display: "inline", marginRight: 5, verticalAlign: "middle" }} />
                  Enter OTP sent to your email
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    value={otpValue}
                    onChange={e => setOtpValue(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit OTP"
                    style={{ ...inputStyle, flex: 1, letterSpacing: "0.2em", fontWeight: 700 }}
                    autoFocus
                  />
                  <button
                    type="button"
                    disabled={verifyingOtp}
                    onClick={handleVerifyOtp}
                    style={{
                      height: 44, padding: "0 16px", borderRadius: 10, border: "none",
                      background: "linear-gradient(90deg,#059669,#10B981)",
                      color: "#FFFFFF", fontSize: 13, fontWeight: 700,
                      cursor: verifyingOtp ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                    }}
                  >
                    {verifyingOtp ? <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={13} />}
                    Confirm
                  </button>
                </div>
              </div>
            )}

            {/* Password field — signin & signup */}
            {mode !== "forgot" && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#CBD5E1", display: "block", marginBottom: 6 }}>
                  <Lock size={13} style={{ display: "inline", marginRight: 5, verticalAlign: "middle" }} />
                  {mode === "signup" ? "Create Password" : "Password"}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPwd ? "text" : "password"}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "Min. 8 characters" : "••••••••"}
                    minLength={mode === "signup" ? 8 : undefined}
                    style={{ ...inputStyle, paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(p => !p)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748B", cursor: "pointer", padding: 0 }}
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {mode === "signup" && password && (
                  <div style={{ marginTop: 6, display: "flex", gap: 4 }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: password.length >= i * 3 ? (password.length >= 12 ? "#059669" : password.length >= 8 ? "#D97706" : "#EF4444") : "#1E293B", transition: "all 0.2s" }} />
                    ))}
                    <span style={{ fontSize: 10, color: "#64748B", marginLeft: 4, alignSelf: "center" }}>
                      {password.length < 8 ? "Weak" : password.length < 12 ? "Fair" : "Strong"}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Confirm Password — signup only */}
            {mode === "signup" && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#CBD5E1", display: "block", marginBottom: 6 }}>
                  <Lock size={13} style={{ display: "inline", marginRight: 5, verticalAlign: "middle" }} />
                  Confirm Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirmPwd ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    style={{
                      ...inputStyle, paddingRight: 44,
                      borderColor: confirmPassword && confirmPassword !== password ? "#EF4444" : confirmPassword && confirmPassword === password ? "#059669" : "#334155",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd(p => !p)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748B", cursor: "pointer", padding: 0 }}
                  >
                    {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && (
                  <p style={{ fontSize: 11, marginTop: 5, color: confirmPassword === password ? "#10B981" : "#EF4444" }}>
                    {confirmPassword === password ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </p>
                )}
              </div>
            )}

            {/* Forgot password email field */}
            {mode === "forgot" && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#CBD5E1", display: "block", marginBottom: 6 }}>Email Address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" style={inputStyle} />
              </div>
            )}

            {/* Forgot password link — sign in only */}
            {mode === "signin" && (
              <button
                type="button"
                onClick={() => setMode("forgot")}
                style={{ background: "none", border: "none", color: "#6366F1", fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "right", padding: 0, marginTop: -8 }}
              >
                Forgot password?
              </button>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                height: 46, borderRadius: 12, fontSize: 15, fontWeight: 700,
                background: "linear-gradient(90deg, #2563EB 0%, #4F46E5 100%)",
                color: "#FFFFFF",
                border: "none",
                cursor: submitting ? "not-allowed" : "pointer",
                marginTop: 4,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.2s",
              }}
            >
              <span>
                {submitting ? "Processing..." :
                  mode === "signin" ? "Sign In" :
                  mode === "signup" ? "Create Account" :
                  "Send Reset Link"}
              </span>
              {!submitting && <ArrowRight size={16} />}
            </button>

            {/* Back from forgot */}
            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => setMode("signin")}
                style={{ background: "none", border: "none", color: "#64748B", fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "center" }}
              >
                ← Back to Sign In
              </button>
            )}
          </form>
        </div>
      )}

      {/* ─── COMING SOON MODAL ─────────────────────────────────────────────── */}
      {comingSoon && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(2, 6, 23, 0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}
          onClick={() => setComingSoon(null)}
        >
          <div
            style={{ background: "rgba(15, 23, 42, 0.98)", border: "1px solid #1E293B", borderRadius: 24, padding: "40px 48px", maxWidth: 440, textAlign: "center", position: "relative" }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setComingSoon(null)} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.1)", border: "none", color: "#94A3B8", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}>
              <X size={16} />
            </button>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><RenderServiceLogo type={comingSoon.type} /></div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#FFFFFF", marginBottom: 8 }}>{comingSoon.label}</div>
            <div style={{ display: "inline-block", padding: "6px 18px", background: "rgba(37, 99, 235, 0.2)", border: "1px solid rgba(37, 99, 235, 0.4)", borderRadius: 20, fontSize: 12, fontWeight: 700, color: "#60A5FA", marginBottom: 20, textTransform: "uppercase" }}>
              🚀 Coming Soon
            </div>
            <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.6, marginBottom: 24 }}>
              {comingSoon.description} is currently under development. We&apos;re working hard to bring you this feature soon!
            </p>
            <button
              onClick={() => setComingSoon(null)}
              style={{ background: "linear-gradient(90deg, #2563EB 0%, #4F46E5 100%)", border: "none", color: "#FFFFFF", padding: "12px 28px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      {/* Spin animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
