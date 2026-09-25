import React, { useState } from "react";
import { Box, IconButton, Tooltip, Snackbar, Alert } from "@mui/material";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import ThumbDownOffAltIcon from "@mui/icons-material/ThumbDownOffAlt";
import ThumbDownAltIcon from "@mui/icons-material/ThumbDownAlt";
import FeedbackModal from "./FeedbackModal";
import { feedbackApi } from "../../api/feedbackApi";

const FeedbackRatingButtons = ({
  question,
  originalResponse,
  conversationId,
  messageId,
  companyId,
  shipType,
  sourceMetadata,
}) => {
  const [ratingState, setRatingState] = useState(null); // 'positive' | 'negative' | null
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const userId = localStorage.getItem("userId") || localStorage.getItem("user_id") || "anonymous";

  const handlePositiveClick = async () => {
    if (ratingState === "positive") return;

    try {
      setRatingState("positive");
      await feedbackApi.submitFeedback({
        question: question || "User Question",
        original_response: originalResponse || "",
        feedback_type: "positive",
        rating: "positive",
        conversation_id: conversationId,
        session_id: conversationId,
        message_id: messageId ? parseInt(messageId, 10) || null : null,
        user_id: userId,
        company_id: companyId || null,
        ship_type: shipType || null,
        source_metadata: sourceMetadata || {},
      });

      setToast({
        open: true,
        message: "Thank you for your feedback!",
        severity: "success",
      });
    } catch (error) {
      console.error("Failed to submit positive feedback:", error);
      setToast({
        open: true,
        message: "Failed to record feedback. Please try again.",
        severity: "error",
      });
    }
  };

  const handleNegativeClick = () => {
    setModalOpen(true);
  };

  const handleNegativeSubmitted = () => {
    setRatingState("negative");
    setToast({
      open: true,
      message: "Feedback submitted to SME moderation queue. Thank you!",
      severity: "success",
    });
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          mt: 1,
          ml: 0.5,
          opacity: 0.7,
          transition: "opacity 0.2s ease",
          "&:hover": { opacity: 1 },
        }}
      >
        <Tooltip title={ratingState === "positive" ? "Helpful" : "Good answer"}>
          <span>
            <IconButton
              size="small"
              onClick={handlePositiveClick}
              disabled={ratingState === "negative"}
              sx={{
                p: 0.5,
                color: ratingState === "positive" ? "success.main" : "text.secondary",
                "&:hover": { color: "success.main", transform: "scale(1.1)" },
                transition: "all 0.15s ease",
              }}
            >
              {ratingState === "positive" ? (
                <ThumbUpAltIcon fontSize="small" />
              ) : (
                <ThumbUpOffAltIcon fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title={ratingState === "negative" ? "Reported issue" : "Report an issue with this response"}>
          <span>
            <IconButton
              size="small"
              onClick={handleNegativeClick}
              disabled={ratingState === "positive"}
              sx={{
                p: 0.5,
                color: ratingState === "negative" ? "error.main" : "text.secondary",
                "&:hover": { color: "error.main", transform: "scale(1.1)" },
                transition: "all 0.15s ease",
              }}
            >
              {ratingState === "negative" ? (
                <ThumbDownAltIcon fontSize="small" />
              ) : (
                <ThumbDownOffAltIcon fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Negative Feedback Modal */}
      <FeedbackModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleNegativeSubmitted}
        question={question}
        originalResponse={originalResponse}
        conversationId={conversationId}
        messageId={messageId}
        companyId={companyId}
        shipType={shipType}
        sourceMetadata={sourceMetadata}
      />

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: 2, boxShadow: 4 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default FeedbackRatingButtons;
