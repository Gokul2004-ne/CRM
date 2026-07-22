"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import GlobalSearchModal from "@/components/GlobalSearchModal";
import { toast } from "sonner";
import { Lock, Mail, ShieldCheck, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AppShell({ children, title, subtitle }: AppShellProps) {
  const { sidebarCollapsed, loadSupabaseData } = useAppStore();
  const { user, loading, signInWithEmail, signUpWithEmail, resetPasswordForEmail } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Auth form state when unauthenticated
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

  // If loading auth state, show smooth loader
  if (loading) {
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
        }}
      >
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p style={{ fontSize: "14px", color: "#94A3B8", fontWeight: 500 }}>
          Loading CRM Practice Workspace...
        </p>
      </div>
    );
  }

  // If unauthenticated, present the sleek Login / Sign Up portal
  if (!user) {
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
        }}
      >
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
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
                boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.4)",
              }}
            >
              <ShieldCheck style={{ width: "32px", height: "32px", color: "#FFFFFF" }} />
            </div>
            <h1
              style={{
                fontSize: "26px",
                fontWeight: 800,
                letterSpacing: "-0.5px",
                color: "#FFFFFF",
                marginBottom: "6px",
              }}
            >
              CRMExpert Enterprise
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

          {/* Tab Navigation: Sign In & Register Only */}
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

          {/* Inline Error Notice */}
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

          {/* Forgot Password Success View */}
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
                onClick={() => {
                  setAuthMode("signin");
                  setResetSent(false);
                }}
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
            <form
              onSubmit={handleAuthSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
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
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
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

              {/* Password Field (only for signin/signup) */}
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
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
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

                  {/* Right-aligned Forgot Password Link (Sign In mode only) */}
                  {authMode === "signin" && (
                    <div style={{ textAlign: "right", marginTop: "8px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("forgot");
                          setInlineError(null);
                        }}
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

              {/* Back button for Forgot mode */}
              {authMode === "forgot" && (
                <div style={{ textAlign: "left" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signin");
                      setInlineError(null);
                    }}
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
      </div>
    );
  }

  // Once authenticated, render full CRM AppShell UI without changing any UI
  return (
    <div className="app-shell">
      <Sidebar />
      <div className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <Topbar title={title} subtitle={subtitle} />
        <div className="page-wrapper">{children}</div>
      </div>
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
