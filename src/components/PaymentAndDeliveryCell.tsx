"use client";

import { formatCurrency } from "@/lib/utils";

interface Props {
  amountBilled?: number;
  amountReceived?: number;
  deliveryStatus?: string;
  onUpdateDeliveryStatus?: (newStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED") => void;
  onRecordPayment?: () => void;
}

export default function PaymentAndDeliveryCell({
  amountBilled = 0,
  amountReceived = 0,
  deliveryStatus = "PENDING",
  onUpdateDeliveryStatus,
  onRecordPayment
}: Props) {
  const billed = amountBilled || 0;
  const received = amountReceived || 0;
  const percent = billed > 0 ? Math.min(Math.round((received / billed) * 100), 100) : 0;

  // Payment Badge Logic
  let payBadge = { label: "Pending", bg: "#F1F5F9", color: "#475569", border: "#CBD5E1" };
  let barColor = "#DC2626";

  if (billed > 0 && received >= billed) {
    payBadge = { label: "Paid", bg: "#DCFCE7", color: "#166534", border: "#86EFAC" };
    barColor = "#059669";
  } else if (received > 0) {
    payBadge = { label: "Partially Paid", bg: "#FEF3C7", color: "#92400E", border: "#FCD34D" };
    barColor = "#D97706";
  } else {
    payBadge = { label: "Pending", bg: "#F1F5F9", color: "#475569", border: "#CBD5E1" };
    barColor = "#94A3B8";
  }

  // Delivery Badge Logic
  let delBadge = { label: "Not Started", bg: "#F1F5F9", color: "#475569" };
  if (deliveryStatus === "COMPLETED" || deliveryStatus === "DELIVERED") {
    delBadge = { label: "Service Delivered", bg: "#EFF6FF", color: "#1D4ED8" };
  } else if (deliveryStatus === "IN_PROGRESS") {
    delBadge = { label: "In Progress", bg: "#FEFCE8", color: "#B45309" };
  }

  return (
    <div style={{ display: "grid", gap: 6, minWidth: 200 }}>
      {/* Amount Progress Bar & Numbers (Received / Billed) */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, fontWeight: 700, marginBottom: 3 }}>
          <span style={{ color: "#059669", fontWeight: 800 }}>{formatCurrency(received)}</span>
          <span style={{ color: "#64748B" }}>/ {formatCurrency(billed)}</span>
        </div>
        <div style={{ width: "100%", height: 6, background: "#E2E8F0", borderRadius: 4, overflow: "hidden" }}>
          <div
            style={{
              width: `${percent}%`,
              height: "100%",
              background: barColor,
              borderRadius: 4,
              transition: "width 0.3s ease"
            }}
          />
        </div>
      </div>

      {/* Stacked Badges: Payment Status + Service Delivery Status + Record Payment Button */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
        <span
          className="badge-slds"
          style={{
            background: payBadge.bg,
            color: payBadge.color,
            border: `1px solid ${payBadge.border}`,
            fontSize: 10,
            padding: "2px 7px",
            fontWeight: 800
          }}
        >
          {payBadge.label} ({percent}%)
        </span>

        <span
          className="badge-slds"
          style={{
            background: delBadge.bg,
            color: delBadge.color,
            border: "1px solid #CBD5E1",
            fontSize: 10,
            padding: "2px 7px",
            fontWeight: 800,
            cursor: onUpdateDeliveryStatus ? "pointer" : "default"
          }}
          onClick={() => {
            if (!onUpdateDeliveryStatus) return;
            const nextStatus =
              deliveryStatus === "COMPLETED"
                ? "PENDING"
                : deliveryStatus === "IN_PROGRESS"
                ? "COMPLETED"
                : "IN_PROGRESS";
            onUpdateDeliveryStatus(nextStatus);
          }}
          title={onUpdateDeliveryStatus ? "Click to toggle Delivery Status (Not Started → In Progress → Delivered)" : undefined}
        >
          {delBadge.label}
        </span>

        {onRecordPayment && (
          <button
            type="button"
            className="chip"
            style={{
              background: "#059669",
              color: "#FFFFFF",
              fontSize: 10,
              padding: "2px 6px",
              fontWeight: 700,
              cursor: "pointer",
              border: "none"
            }}
            onClick={onRecordPayment}
            title="Click to Record Received Payment"
          >
            + Payment
          </button>
        )}
      </div>
    </div>
  );
}
