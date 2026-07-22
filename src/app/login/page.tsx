"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Lock, Mail, ShieldCheck, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user, signInWithEmail, signUpWithEmail, resetPasswordForEmail } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  // If already logged in, redirect safely
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

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

      {/* Main Card Container with 32px padding on all sides */}
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
            {mode === "signin" && "Sign in to access your practice management workspace"}
            {mode === "signup" && "Create an account to start managing your firm"}
            {mode === "forgot" && "Reset your account password via email"}
          </p>
        </div>

        {/* Tab Navigation: Sign In & Register Only */}
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
              onClick={() => {
                setMode("signin");
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
              onClick={() => {
                setMode("signup");
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
              onClick={() => {
                setMode("signin");
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
          /* Form Fields with 20px gap */
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
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
                {mode === "signin" && (
                  <div style={{ textAlign: "right", marginTop: "8px" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
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
            {mode === "forgot" && (
              <div style={{ textAlign: "left" }}>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
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
    </div>
  );
}
