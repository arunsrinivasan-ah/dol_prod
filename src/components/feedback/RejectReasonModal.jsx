import React, { useState } from "react";
import { Ban, X, Loader2 } from "lucide-react";

const RejectReasonModal = ({
  open,
  onClose,
  onConfirmReject,
  loading = false,
}) => {
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!open) return null;

  const handleClose = () => {
    if (loading) return;
    setReason("");
    setErrorMsg("");
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg("Rejection reason is mandatory.");
      return;
    }
    setErrorMsg("");
    onConfirmReject(reason.trim());
  };

  return (
    <div
      className="fb-modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(15, 28, 46, 0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      <div
        className="fb-modal-box"
        style={{
          width: "100%",
          maxWidth: 520,
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#dc2626", fontWeight: 700, fontSize: 15 }}>
            <Ban style={{ width: 18, height: 18 }} />
            <span>Reject Feedback Record</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            style={{
              padding: 4,
              borderRadius: 8,
              color: "#5c7080",
              backgroundColor: "transparent",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 12, color: "#5c7080", margin: 0, lineHeight: 1.5 }}>
            Please provide a mandatory reason for rejecting this feedback. Rejected feedback records are kept for auditing purposes but will not be added to the approved feedback memory or the DPO training dataset.
          </p>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0f1c2e", marginBottom: 6 }}>
              Rejection Reason <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Enter the justification for rejecting this feedback submission..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) setErrorMsg("");
              }}
              disabled={loading}
              style={{
                width: "100%",
                padding: 12,
                fontSize: 12,
                borderRadius: 10,
                backgroundColor: "#f8fafc",
                border: errorMsg ? "1px solid #dc2626" : "1px solid #cbd5e1",
                color: "#0f1c2e",
                outline: "none",
                boxSizing: "border-box",
                resize: "none",
              }}
            />
            {errorMsg && (
              <p style={{ fontSize: 11, color: "#dc2626", margin: "4px 0 0 0", fontWeight: 600 }}>
                {errorMsg}
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, paddingTop: 10, borderTop: "1px solid #e2e8f0" }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={{
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 600,
                color: "#5c7080",
                backgroundColor: "transparent",
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 700,
                color: "#ffffff",
                backgroundColor: "#dc2626",
                border: "none",
                borderRadius: 10,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              {loading && <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />}
              <span>{loading ? "Rejecting..." : "Confirm Rejection"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectReasonModal;
