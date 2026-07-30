"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Lock, Mail, ArrowRight, ArrowLeft, CheckCircle, X } from "lucide-react";

type ServiceBlock = {
  code: string;
  label: string;
  description: string;
  active: boolean;
  gradient: string;
  icon: string;
};

const serviceBlocks: ServiceBlock[] = [
  {
    code: "CA",
    label: "CA Expert",
    description: "Chartered Accountant Practice Management",
    active: false,
    gradient: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)",
    icon: "📊",
  },
  {
    code: "CM",
    label: "CM Expert",
    description: "Compliance Management & Regulatory Tracking",
    active: false,
    gradient: "linear-gradient(135deg, #1A3A2A 0%, #059669 100%)",
    icon: "📋",
  },
  {
    code: "CRM",
    label: "CRM Expert",
    description: "Client Relationship & Practice Management",
    active: true,
    gradient: "linear-gradient(135deg, #2D1B69 0%, #4F46E5 100%)",
    icon: "🏢",
  },
  {
    code: "CMR",
    label: "CMR Expert",
    description: "Case Management & Resolution System",
    active: false,
    gradient: "linear-gradient(135deg, #4A1A1A 0%, #DC2626 100%)",
    icon: "⚖️",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { user, signInWithEmail, signUpWithEmail, resetPasswordForEmail } = useAuth();

  const [screen, setScreen] = useState<"landing" | "login">("landing");
  const [comingSoon, setComingSoon] = useState<ServiceBlock | null>(null);
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleBlockClick = (block: ServiceBlock) => {
    if (block.active) {
      setScreen("login");
    } else {
      setComingSoon(block);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setInlineError(null);

    try {
      if (mode === "signin") {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          setInlineError(error.message || "Invalid login credentials");
          toast.error(error.message || "Failed to sign in");
        } else {
          toast.success("Successfully logged in!");
          router.push("/");
        }
      } else if (mode === "signup") {
        const { error } = await signUpWithEmail(email, password);
        if (error) {
          setInlineError(error.message || "Failed to create account");
          toast.error(error.message || "Failed to sign up");
        } else {
          toast.success("Account created successfully!");
          router.push("/");
        }
      } else if (mode === "forgot") {
        if (!email) {
          setInlineError("Please enter your email address");
          setLoading(false);
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
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#020617",
        color: "#FFFFFF",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Ambient background glow accents */}
      <div
        style={{
          position: "absolute",
          top: "-15%",
          left: "-15%",
          width: "500px",
          height: "500px",
          backgroundColor: "rgba(37, 99, 235, 0.15)",
          borderRadius: "50%",
          filter: "blur(120px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-15%",
          right: "-15%",
          width: "500px",
          height: "500px",
          backgroundColor: "rgba(79, 70, 229, 0.15)",
          borderRadius: "50%",
          filter: "blur(120px)",
          pointerEvents: "none",
        }}
      />

      {/* ─── LANDING SCREEN ─── */}
      {screen === "landing" && (
        <div style={{ width: "100%", maxWidth: 860, zIndex: 10 }}>
          {/* Brand */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <img
              src="/zpluscrm-logo.svg"
              alt="zpluscrm Logo"
              style={{ width: 200, height: "auto", marginBottom: 20 }}
            />
            <h1
              style={{
                fontSize: 32,
                fontWeight: 900,
                color: "#FFFFFF",
                margin: 0,
                letterSpacing: "-0.5px",
              }}
            >
              Welcome to our Services
            </h1>
            <p style={{ fontSize: 15, color: "#94A3B8", marginTop: 10 }}>
              Select a platform to continue
            </p>
          </div>

          {/* 4 Service Blocks */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 20,
            }}
          >
            {serviceBlocks.map((block) => (
              <button
                key={block.code}
                onClick={() => handleBlockClick(block)}
                style={{
                  background: block.active
                    ? block.gradient
                    : "rgba(15, 23, 42, 0.8)",
                  border: block.active
                    ? "2px solid rgba(255,255,255,0.25)"
                    : "2px solid #1E293B",
                  borderRadius: 20,
                  padding: "32px 20px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 14,
                  textAlign: "center",
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: block.active
                    ? "0 20px 40px rgba(79, 70, 229, 0.35)"
                    : "none",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-6px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = block.active
                    ? "0 28px 50px rgba(79, 70, 229, 0.5)"
                    : "0 10px 30px rgba(0,0,0,0.3)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = block.active
                    ? "0 20px 40px rgba(79, 70, 229, 0.35)"
                    : "none";
                }}
              >
                {/* Coming Soon badge for inactive blocks */}
                {!block.active && (
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      background: "rgba(100,116,139,0.4)",
                      color: "#94A3B8",
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: 20,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Coming Soon
                  </div>
                )}

                {/* Active badge */}
                {block.active && (
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      background: "rgba(84, 180, 0, 0.9)",
                      color: "#FFFFFF",
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: 20,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    ● Active
                  </div>
                )}

                {/* Icon */}
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: block.active
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                  }}
                >
                  {block.icon}
                </div>

                {/* Code */}
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: block.active ? "#FFFFFF" : "#475569",
                    letterSpacing: "-0.5px",
                  }}
                >
                  {block.code}
                </div>

                {/* Label */}
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: block.active ? "#E2E8F0" : "#64748B",
                  }}
                >
                  {block.label}
                </div>

                {/* Description */}
                <div
                  style={{
                    fontSize: 11,
                    color: block.active ? "rgba(255,255,255,0.6)" : "#475569",
                    lineHeight: 1.5,
                  }}
                >
                  {block.description}
                </div>

                {/* CTA for active */}
                {block.active && (
                  <div
                    style={{
                      marginTop: 4,
                      padding: "8px 20px",
                      background: "rgba(255,255,255,0.2)",
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    Sign In <ArrowRight size={13} />
                  </div>
                )}
              </button>
            ))}
          </div>

          <p
            style={{
              textAlign: "center",
              marginTop: 32,
              fontSize: 12,
              color: "#475569",
            }}
          >
            © 2025 zpluscrm • Practice Management Suite
          </p>
        </div>
      )}

      {/* ─── LOGIN FORM SCREEN ─── */}
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
          {/* Back button */}
          <button
            type="button"
            onClick={() => {
              setScreen("landing");
              setInlineError(null);
              setMode("signin");
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

          {/* Header Section */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            <img
              src="/zpluscrm-logo.svg"
              alt="zpluscrm Logo"
              style={{ width: "200px", height: "auto", marginBottom: "16px" }}
            />
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
              {mode === "signin" && "Sign in to access your practice management workspace"}
              {mode === "signup" && "Create an account to start managing your firm"}
              {mode === "forgot" && "Reset your account password via email"}
            </p>
          </div>

          {/* Tab Navigation */}
          {mode !== "forgot" && (
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
                onClick={() => { setMode("signin"); setInlineError(null); }}
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
                    mode === "signin"
                      ? "linear-gradient(90deg, #2563EB 0%, #4F46E5 100%)"
                      : "transparent",
                  color: mode === "signin" ? "#FFFFFF" : "#94A3B8",
                  boxShadow:
                    mode === "signin" ? "0 4px 12px rgba(37, 99, 235, 0.3)" : "none",
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode("signup"); setInlineError(null); }}
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
                    mode === "signup"
                      ? "linear-gradient(90deg, #2563EB 0%, #4F46E5 100%)"
                      : "transparent",
                  color: mode === "signup" ? "#FFFFFF" : "#94A3B8",
                  boxShadow:
                    mode === "signup" ? "0 4px 12px rgba(37, 99, 235, 0.3)" : "none",
                }}
              >
                Register
              </button>
            </div>
          )}

          {/* Inline Error */}
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

          {/* Forgot Password Success */}
          {mode === "forgot" && resetSent ? (
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
                onClick={() => { setMode("signin"); setResetSent(false); }}
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
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Email Field */}
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

              {/* Password Field */}
              {mode !== "forgot" && (
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

                  {mode === "signin" && (
                    <div style={{ textAlign: "right", marginTop: "8px" }}>
                      <button
                        type="button"
                        onClick={() => { setMode("forgot"); setInlineError(null); }}
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

              {/* Back to Sign In (forgot mode) */}
              {mode === "forgot" && (
                <div style={{ textAlign: "left" }}>
                  <button
                    type="button"
                    onClick={() => { setMode("signin"); setInlineError(null); }}
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
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
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  boxShadow: "0 10px 20px -5px rgba(37, 99, 235, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                }}
              >
                <span>
                  {loading
                    ? "Processing..."
                    : mode === "signin"
                    ? "Sign In"
                    : mode === "signup"
                    ? "Create Account"
                    : "Send Reset Link"}
                </span>
                {!loading && <ArrowRight style={{ width: "18px", height: "18px" }} />}
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

            <div style={{ fontSize: 48, marginBottom: 16 }}>{comingSoon.icon}</div>

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
