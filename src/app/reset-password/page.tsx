"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Lock, ShieldCheck, ArrowRight, CheckCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);

      if (hash.includes("error_description=")) {
        const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.substring(1) : hash);
        const errorDesc = hashParams.get("error_description");
        if (errorDesc) {
          setError(decodeURIComponent(errorDesc.replace(/\+/g, " ")));
        }
      } else if (params.has("error_description")) {
        const errorDesc = params.get("error_description");
        if (errorDesc) {
          setError(errorDesc);
        }
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateErr } = await updatePassword(password);
      if (updateErr) {
        setError(updateErr.message || "Failed to update password.");
        toast.error(updateErr.message || "Failed to update password.");
      } else {
        setCompleted(true);
        toast.success("Password updated successfully! Redirecting to Sign In...");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
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
      {/* Background ambient glows */}
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
            marginBottom: "24px",
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
            Reset Your Password
          </h1>
          <p style={{ fontSize: "14px", color: "#94A3B8", margin: 0 }}>
            Enter your new account password below to finalize reset.
          </p>
        </div>

        {error && (
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
            {error}
          </div>
        )}

        {completed ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <CheckCircle style={{ width: "48px", height: "48px", color: "#10B981", margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF", marginBottom: "8px" }}>
              Password Reset Complete!
            </h3>
            <p style={{ fontSize: "13px", color: "#94A3B8" }}>
              Redirecting you to the Sign In page...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
                New Password
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
                  placeholder="Enter new password"
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
            </div>

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
                Confirm New Password
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
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              }}
            >
              <span>{loading ? "Updating..." : "Update Password"}</span>
              {!loading && <ArrowRight style={{ width: "18px", height: "18px" }} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
