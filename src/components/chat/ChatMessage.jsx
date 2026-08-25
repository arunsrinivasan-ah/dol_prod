import React, { useState } from "react";
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import QuizDisplay from "./QuizDisplay";
import { sanitizeMarkdown } from "./ChatWindow";
import DolphinIconW from "../../assets/images/dolphin_w.png";
import { useThemeMode } from "../../context/ThemeModeContext";
import { VideoIcon } from "../../assets/svgIcons/VideoIcon";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { ImageIcon } from "../../assets/svgIcons/ImageIcon";
import { DocumentIcon } from "../../assets/svgIcons/DocumentIcon";
import MediaPreviewModal from "./MediaPreviewModal";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import ThumbDownOffAltIcon from "@mui/icons-material/ThumbDownOffAlt";
import Tooltip from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";

// ─── Normalisers ───
const normalizeVideo = (v) => ({
  title: v.title || v.Title || "",
  url: v.url || v.Url || v.videourl || "",
  thumbnail: v.thumbnail || v.Thumbnail || "",
});

const normalizeImage = (img) => ({
  title: img.title || img.Title || "",
  url: img.url || img.Url || "",
  thumbnail: img.thumbnail || img.Url || img.url || "",
});

const normalizePdf = (pdf) => ({
  title: pdf.title || pdf.Title || "",
  link: pdf.link || pdf.Link || pdf.url || "",
});

// ── Markdown prose styles ───
export const markdownContainerSx = {
  lineHeight: 1.7,
  wordBreak: "break-word",
  overflowWrap: "break-word",

  // Paragraphs
  "& p": {
    mt: 0,
    mb: "0.65em",
    "&:last-child": { mb: 0 },
  },

  // Headings
  "& h1, & h2, & h3, & h4, & h5, & h6": {
    mt: "1.25em",
    mb: "0.4em",
    fontWeight: 600,
    lineHeight: 1.3,
    "&:first-of-type": { mt: 0 },
  },
  "& h1": { fontSize: "1.35em" },
  "& h2": { fontSize: "1.2em" },
  "& h3": { fontSize: "1.05em" },

  // Lists — each item clearly on its own line
  "& ol": {
    mt: "0.4em",
    mb: "0.65em",
    pl: "1.6em",
    listStyleType: "decimal",
    "&:last-child": { mb: 0 },
  },
  "& ul": {
    mt: "0.4em",
    mb: "0.65em",
    pl: "1.6em",
    listStyleType: "disc",
    "&:last-child": { mb: 0 },
  },
  "& li": {
    display: "list-item",
    mb: "0.4em",
    lineHeight: 1.65,
    "&:last-child": { mb: 0 },
  },
  "& li > ul, & li > ol": {
    mt: "0.25em",
    mb: 0,
  },
  "& li > p": {
    mb: 0,
  },

  // Inline code
  "& code": {
    fontFamily: "monospace",
    fontSize: "0.875em",
    px: "0.35em",
    py: "0.1em",
    borderRadius: "4px",
    backgroundColor: "rgba(0,0,0,0.08)",
  },

  // Code blocks
  "& pre": {
    mt: "0.5em",
    mb: "0.75em",
    p: "0.75em 1em",
    borderRadius: "6px",
    overflowX: "auto",
    backgroundColor: "rgba(0,0,0,0.06)",
    "& code": {
      backgroundColor: "transparent",
      px: 0,
      py: 0,
      fontSize: "0.85em",
    },
  },

  // Blockquotes
  "& blockquote": {
    mt: "0.5em",
    mb: "0.75em",
    pl: "1em",
    borderLeft: "3px solid",
    borderColor: "divider",
    opacity: 0.85,
    "& p": { mb: 0 },
  },

  // HR
  "& hr": {
    my: "1em",
    border: "none",
    borderTop: "1px solid",
    borderColor: "divider",
  },

  "& strong": { fontWeight: 600 },
  "& em": { fontStyle: "italic" },

  // Topic citation badge
  "& .topic-citation": {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    backgroundColor: "primary.main",
    color: "#fff",
    fontSize: "0.65rem",
    fontWeight: 700,
    cursor: "pointer",
    margin: "0 4px",
    verticalAlign: "middle",
    transition: "transform 0.2s ease",
    "&:hover": {
      transform: "scale(1.2)",
      backgroundColor: "primary.dark",
    },
  },
};

// ── Thinking animation ───
const InlineThinkingAnimation = () => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
    <Typography variant="body2" sx={{ color: "#1cb0f6", fontWeight: 500 }}>
      Dolphin is thinking
    </Typography>
    <Box sx={{ display: "flex", alignItems: "center", gap: "5px", height: 20 }}>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            backgroundColor: "#1cb0f6",
            animation: "typingDot 1.2s infinite ease-in-out",
            animationDelay: `${i * 0.2}s`,
            "@keyframes typingDot": {
              "0%, 100%": { opacity: 0.25, transform: "scale(0.8)" },
              "50%": { opacity: 1, transform: "scale(1.2)" },
            },
          }}
        />
      ))}
    </Box>
  </Box>
);

// ─── ChatMessage ──
const ChatMessage = ({
  msg,
  videos_suggestions,
  images_suggestions,
  pdf_suggestions,
  sessionId,
  setSearchQuery,
  handleSend,
  messageIndex,
  onFeedbackSubmit,
  onTopicClick,
  isStreaming,
  skipMarkdownFormatting = false,
  plainText = false,
}) => {
  const [showAllVideos, setShowAllVideos] = useState(false);
  const isUser = msg.role === "user";

  const cleanPlainText = (text) => {
    if (!text) return "";
    return text
      // Remove markdown bullet points
      .replace(/(^|\n)\s*[-*•]\s+/g, "$1")
      // Remove numbered list markers
      .replace(/(^|\n)\s*\d+[.)]\s+/g, "$1")
      // Remove excessive line breaks
      .replace(/\n{2,}/g, "\n")
      .trim();
  };

  const { mode } = useThemeMode();
  const [feedback, setFeedback] = useState(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentPopup, setCommentPopup] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [previewMedia, setPreviewMedia] = useState({
    open: false,
    type: null,
    src: null,
  });
  const openPreview = (type, src) => setPreviewMedia({ open: true, type, src });
  const closePreview = () =>
    setPreviewMedia({ open: false, type: null, src: null });

  const handleFollowUpQuestion = async (query) => {
    setSearchQuery(query);
    await handleSend(query);
  };

  const handleLikeDislike = async (type) => {
    if (type === "dislike") {
      // For dislike: open comment dialog to collect reason, API called on submit
      setFeedback("dislike");
      setCommentText("");
      setCommentDialogOpen(true);
      return;
    }

    // For like: toggle and call API immediately
    const newFeedback = feedback === type ? null : type;
    setFeedback(newFeedback);

    const messageId = messageIndex + 1;
    const userId = localStorage.getItem("user_id");

    if (onFeedbackSubmit && newFeedback) {
      try {
        await onFeedbackSubmit({
          session_id: sessionId,
          message_id: messageId,
          like: 1,
          user_id: userId,
        });
      } catch (error) {
        console.error("Failed to submit feedback:", error);
      }
    }
  };

  const handleCloseCommentDialog = () => {
    setCommentDialogOpen(false);
    setCommentText("");
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    const messageId = messageIndex + 1;
    const userId = localStorage.getItem("user_id");

    try {
      if (onFeedbackSubmit) {
        await onFeedbackSubmit({
          session_id: sessionId,
          message_id: messageId,
          like: 0,
          user_id: userId,
          commond: commentText.trim(),
        });
      }

      handleCloseCommentDialog();
      setCommentPopup({
        open: true,
        message: "Feedback submitted successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Failed to submit comment:", error);
      setCommentPopup({
        open: true,
        message: "Failed to submit feedback. Please try again.",
        severity: "error",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const normalizedVideos = (videos_suggestions || [])
    .map(normalizeVideo)
    .filter((v) => v.url);
  const normalizedImages = (images_suggestions || [])
    .map(normalizeImage)
    .filter((img) => img.url);
  const normalizedPdfs = (pdf_suggestions || [])
    .map(normalizePdf)
    .filter((p) => p.link);

  const questionSuggestions = msg.question_suggestions || [];
  const shouldShowMedia =
    msg.mediaLoaded !== false && msg.content && msg.content.length > 0;
  const shouldShowQuestions =
    msg.mediaLoaded !== false && questionSuggestions.length > 0;

  const getFormattedTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ── Shared card style ───
  const mediaCardSx = {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    width: { xs: "43%", sm: "23%" },
    height: { xs: 140, sm: 170 },
    textDecoration: "none",
    borderRadius: 2,
    p: 0.5,
    backgroundColor: "background.light",
    transition: "0.2s",
    border: "1px solid transparent",
    borderColor: "text.caption",
    cursor: "pointer",
    "&:hover": { borderColor: "primary.main", transform: "translateY(-2px)" },
  };

  const mediaThumbnailSx = {
    width: "100%",
    height: { xs: 100, sm: 130 },
    borderRadius: 1,
    objectFit: "cover",
  };

  const mediaCaptionSx = {
    width: "100%",
    textAlign: "center",
    color: "primary.main",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const showMoreSx = {
    mt: 1,
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "text.primary",
  };

  // ── Render ────
  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1,
          flexDirection: isUser ? "row-reverse" : "row",
        }}
      >
        {/* Avatar */}
        {isUser ? (
          <Avatar
            sx={{
              width: { xs: 40, sm: 50 },
              height: { xs: 40, sm: 50 },
              backgroundColor: "primary.main",
            }}
          />
        ) : (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: { xs: 40, sm: 50 },
              height: { xs: 40, sm: 50 },
              borderRadius: 60,
              backgroundColor: "primary.main",
              flexShrink: 0,
            }}
          >
            <Box
              component="img"
              src={DolphinIconW}
              alt="Dolphin"
              sx={{ width: { xs: 25, sm: 30 }, height: { xs: 25, sm: 30 } }}
            />
          </Box>
        )}

        {/* Content column */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: isUser ? "auto" : "90%",
            maxWidth: "90%",
            gap: 0.5,
          }}
        >
          {/* Name + timestamp */}
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Typography
              variant={isUser ? "h4" : "body1"}
              sx={{ fontWeight: 700, color: "text.heading1" }}
            >
              {isUser ? "You" : "Dolphin AI"}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.caption" }}>
              {getFormattedTime(msg?.timestamp)}
            </Typography>
          </Box>

          {/* Bubble */}
          <Box
            sx={{
              bgcolor: isUser
                ? "background.light"
                : "background.chatbackground",
              px: 2.5,
              py: 2,
              borderRadius: isUser
                ? "18px 4px 18px 18px"
                : "4px 18px 18px 18px",
            }}
          >
            {msg.category !== "QUIZ" ? (
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                {/* Understanding section */}
                {msg.understanding && (
                  <Box
                    sx={{
                      mb: 1.5,
                      pb: 1.5,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      opacity: 0.9,
                    }}
                  >
                    <Typography
                      component="p"
                      sx={{
                        m: 0,
                        lineHeight: 1.7,
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        whiteSpace: "normal",
                      }}
                    >
                      {(msg.understanding || "")
                        // Remove bullet points
                        .replace(/(^|\n)\s*[-*•]\s+/g, "$1")
                        // Remove numbered points
                        .replace(/(^|\n)\s*\d+[.)]\s+/g, "$1")
                        // Convert line breaks to spaces
                        .replace(/\s+/g, " ")
                        .trim()}
                    </Typography>
                  </Box>
                )}

                {/* Main content and Sources */}
                <Box
                  sx={{
                    display: "block",
                    lineHeight: 1.7,
                  }}
                  onClick={(e) => {
                    const target = e.target.closest(".topic-citation");
                    if (target) {
                      const index =
                        parseInt(target.getAttribute("data-topic-index")) - 1;
                      if (msg.topics && msg.topics[index]) {
                        onTopicClick?.(msg.topics[index]);
                      }
                    }
                  }}
                >
                  {plainText ? (
                    <Typography
                      component="div"
                      sx={{
                        lineHeight: 1.7,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                      }}
                    >
                      {cleanPlainText(msg.content || "")}
                    </Typography>
                  ) : (
                    <Box
                      component="div"
                      className="chat-markdown"
                      sx={{
                        ...markdownContainerSx,
                        display: "block",
                      }}
                      dangerouslySetInnerHTML={{
                        __html: sanitizeMarkdown(
                          msg.content || "",
                          skipMarkdownFormatting
                        ).replace(
                          /(?:@@SOURCE_REF_|\[\[\s*Ref:?\s*)(\d+)\s*(?:@@|\]\])/gi,
                          '<span class="topic-citation" data-topic-index="$1" title="Click to see related topic notes">$1</span>',
                        ),
                      }}
                    />
                  )}

                  {/* Inline thinking animation */}
                  {msg.content &&
                    msg.content.includes("Dolphin is thinking...") && (
                      <InlineThinkingAnimation />
                    )}
                </Box>

                {/* Company Content section */}
                {(msg.company_content || msg.companyContent) && (
                  <Box
                    sx={{
                      mt: 1.5,
                      pt: 1.5,
                      borderTop: "1px solid",
                      borderColor: "divider",
                      display: "block",
                      lineHeight: 1.7,
                    }}
                  >
                    <Box
                      className="chat-markdown"
                      sx={{
                        ...markdownContainerSx,
                        display: "block",
                      }}
                      dangerouslySetInnerHTML={{
                        __html: sanitizeMarkdown(msg.company_content || msg.companyContent, true),
                      }}
                    />
                  </Box>
                )}

              </Box>
            ) : (
              <QuizDisplay quizContent={msg.content || []} />
            )}

            {/* Image Suggestions */}
            {!isUser && shouldShowMedia && normalizedImages.length > 0 && (
              <Box sx={{ mt: 2.5 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    mb: 1,
                  }}
                >
                  <ImageIcon
                    size={20}
                    color={mode === "dark" ? "#e8f1fb" : "#0f1c2e"}
                  />
                  <Typography variant="h3" sx={{ color: "text.primary" }}>
                    Images
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    flexWrap: "wrap",
                    py: 1,
                  }}
                >
                  {normalizedImages.map((img, i) => (
                    <Box
                      key={i}
                      sx={mediaCardSx}
                      onClick={() => openPreview("image", img.url)}
                    >
                      <Box
                        component="img"
                        src={img.url}
                        alt={img.title}
                        sx={mediaThumbnailSx}
                        onError={(e) => {
                          console.log("IMAGE LOAD FAILED", img);
                        }}
                      />

                      <Typography variant="caption" sx={mediaCaptionSx}>
                        {img.title}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* All Videos (Transcripts + Normal) */}
            {!isUser && shouldShowMedia && (normalizedVideos.length > 0 || (msg.transcripts && msg.transcripts.filter(t => t.video_link || t.Url || t.url).length > 0)) && (
              <Box sx={{ mt: 2.5 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    mb: 1,
                  }}
                >
                  <VideoIcon
                    size={30}
                    color={mode === "dark" ? "#e8f1fb" : "#0f1c2e"}
                  />
                  <Typography variant="h3" sx={{ color: "text.primary" }}>
                    Videos
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    flexWrap: "wrap",
                    maxHeight: showAllVideos ? "none" : { xs: 155, sm: 185 },
                    overflow: "hidden",
                    py: 1,
                  }}
                >
                  {/* Transcript Videos First */}
                  {msg.transcripts && msg.transcripts.filter(t => t.video_link || t.Url || t.url).map((t, i) => {
                    const videoTitle = t.video_title || t.Title || t.title || (t.content ? (t.content.substring(0, 40) + "...") : "Transcript Video");
                    const videoLink = t.video_link || t.Url || t.url;

                    // Derive thumbnail by replacing .mp4 with .png for marinerskills URLs
                    const transcriptImg = t.video_thumbnail || t.thumbnail || t.Thumbnail || t.image || t.image_url || t.imageUrl || (videoLink ? videoLink.replace(/\.mp4$/i, ".png") : "");

                    return (
                      <Box
                        key={`transcript-${i}`}
                        sx={mediaCardSx}
                        onClick={() => openPreview("video", videoLink)}
                      >
                        {transcriptImg && (
                          <Box
                            component="img"
                            src={transcriptImg}
                            alt={videoTitle}
                            sx={mediaThumbnailSx}
                            onError={(e) => {
                              // If image fails to load, gracefully fall back
                              e.target.style.display = 'none';
                              const fallback = e.target.nextElementSibling;
                              if (fallback && fallback.classList.contains('fallback-icon-container')) {
                                fallback.style.display = 'flex';
                              }
                            }}
                          />
                        )}
                        <Box
                          className="fallback-icon-container"
                          sx={{
                            ...mediaThumbnailSx,
                            display: transcriptImg ? "none" : "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "background.paper",
                          }}
                        >
                          <VideoIcon size={40} color="primary.main" />
                        </Box>
                        <Box
                          sx={{
                            position: "absolute",
                            top: "40%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            backgroundColor: "rgba(0,0,0,0.45)",
                          }}
                        >
                          <PlayArrowRoundedIcon
                            sx={{ color: "#fff", fontSize: 22 }}
                          />
                        </Box>
                        <Typography variant="caption" sx={mediaCaptionSx}>
                          {videoTitle}
                        </Typography>
                      </Box>
                    );
                  })}

                  {/* Normal Videos Second */}
                  {normalizedVideos.map((video, i) => (
                    <Box
                      key={`normal-${i}`}
                      sx={mediaCardSx}
                      onClick={() => openPreview("video", video.url)}
                    >
                      <Box
                        component="img"
                        src={video.thumbnail}
                        alt={video.title}
                        sx={mediaThumbnailSx}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          top: "40%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          backgroundColor: "rgba(0,0,0,0.45)",
                        }}
                      >
                        <PlayArrowRoundedIcon
                          sx={{ color: "#fff", fontSize: 22 }}
                        />
                      </Box>
                      <Typography variant="caption" sx={mediaCaptionSx}>
                        {video.title}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {((normalizedVideos.length + (msg.transcripts ? msg.transcripts.filter(t => t.video_link || t.Url || t.url).length : 0)) > 4) && (
                  <Typography
                    onClick={() => setShowAllVideos((p) => !p)}
                    variant="body1"
                    sx={showMoreSx}
                  >
                    {showAllVideos ? "Show less" : "Show more"}
                    {showAllVideos ? (
                      <KeyboardArrowUpIcon />
                    ) : (
                      <KeyboardArrowDownIcon />
                    )}
                  </Typography>
                )}
              </Box>
            )}

            {/* PDF Suggestions */}
            {!isUser && shouldShowMedia && normalizedPdfs.length > 0 && (
              <Box sx={{ mt: 2.5 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    mb: 1,
                  }}
                >
                  <DocumentIcon
                    size={20}
                    color={mode === "dark" ? "#e8f1fb" : "#0f1c2e"}
                  />
                  <Typography variant="h3" sx={{ color: "text.primary" }}>
                    Documents
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    flexWrap: "wrap",
                    py: 1,
                  }}
                >
                  {normalizedPdfs.map((pdf, i) => (
                    <Box
                      key={i}
                      sx={mediaCardSx}
                      onClick={() => window.open(pdf.link, "_blank")}
                    >
                      <Box
                        sx={{
                          ...mediaThumbnailSx,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "background.paper",
                        }}
                      >
                        <DocumentIcon size={40} color="primary.main" />
                      </Box>
                      <Typography variant="caption" sx={mediaCaptionSx}>
                        {pdf.title}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
            {
              msg.checkLicCoursesData && msg.checkLicCoursesData.length > 0 && (
                <Box sx={{ mt: 2.5 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      color: "text.primary",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                    }}
                  >
                    Topics from licensed courses
                  </Typography>

                  {msg.checkLicCoursesData?.map((course, i) => (
                    course.matched && (
                      <Box
                        key={i}
                        sx={(theme) => ({
                          display: "flex",
                          alignItems: "center",
                          p: 1,
                          borderRadius: 3,
                          backgroundColor: "background.light",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          border: "1.5px solid transparent",
                          "&:hover": {
                            borderColor: theme.palette.primary.main,
                            color: theme.palette.primary.main,
                          },
                        })}
                      >
                        {course.data?.course}
                      </Box>
                    )
                  ))}
                </Box>
              )}

            {/* Follow-up suggestions */}
            {shouldShowQuestions && (
              <Box
                sx={{
                  mt: 2.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    color: "text.primary",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                  }}
                >
                  Try asking...
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {questionSuggestions.map((q, i) => (
                    <Box
                      key={i}
                      sx={(theme) => ({
                        display: "flex",
                        alignItems: "center",
                        p: 1,
                        borderRadius: 3,
                        backgroundColor: "background.light",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        border: "1.5px solid transparent",
                        "&:hover": {
                          borderColor: theme.palette.primary.main,
                          color: theme.palette.primary.main,
                        },
                      })}
                      onClick={() => handleFollowUpQuestion(q)}
                    >
                      <Typography variant="body2">
                        {q.replace(/^(\d+[.)]|[-*•])\s*/, "")}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          {/* Like/Dislike Icons - only shown after full response is received */}
          {!isUser &&
            msg.mediaLoaded !== false &&
            msg.content &&
            msg.content.trim().length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mt: 0.5,
                  ml: 0.5,
                  opacity: 0.6,
                  transition: "opacity 0.2s ease",
                  "&:hover": {
                    opacity: 1,
                  },
                }}
              >
                <Tooltip title={feedback === "like" ? "Remove like" : "Like"}>
                  <IconButton
                    size="small"
                    onClick={() => handleLikeDislike("like")}
                    disabled={feedback === "dislike"}
                    sx={{
                      color:
                        feedback === "like" ? "success.main" : "text.secondary",
                      p: 0.5,
                      opacity: feedback === "dislike" ? 0.3 : 1,
                    }}
                  >
                    <ThumbUpOffAltIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title={feedback === "dislike" ? "Dislike" : "Dislike"}>
                  <IconButton
                    size="small"
                    onClick={() => handleLikeDislike("dislike")}
                    disabled={feedback === "like"}
                    sx={{
                      color:
                        feedback === "dislike"
                          ? "error.main"
                          : "text.secondary",
                      p: 0.5,
                      opacity: feedback === "like" ? 0.3 : 1,
                    }}
                  >
                    <ThumbDownOffAltIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
        </Box>

        <MediaPreviewModal
          open={previewMedia.open}
          type={previewMedia.type}
          src={previewMedia.src}
          onClose={closePreview}
        />
      </Box>

      {/* Comment Dialog */}
      <Dialog
        open={commentDialogOpen}
        onClose={handleCloseCommentDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: "background.paper",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Tell us what went wrong
          </Typography>
          <IconButton
            onClick={handleCloseCommentDialog}
            size="small"
            sx={{ color: "text.secondary" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            Please share what was wrong with this response. Your feedback helps
            us to improve.
          </Typography>

          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            placeholder="Type your comment here..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: "background.light",
                "& textarea": {
                  fontSize: 14,
                  lineHeight: 1.6,
                },
              },
            }}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
          <Button
            onClick={handleCloseCommentDialog}
            variant="outlined"
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 2,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitComment}
            variant="contained"
            disabled={!commentText.trim() || isSubmittingComment}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 3,
              bgcolor: "primary.main",
              "&:hover": {
                bgcolor: "primary.dark",
              },
              "&.Mui-disabled": {
                opacity: 0.5,
              },
            }}
          >
            {isSubmittingComment ? "Submitting..." : "Submit Comment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comment Success/Failure Popup */}
      <Snackbar
        open={commentPopup.open}
        autoHideDuration={3000}
        onClose={() => setCommentPopup({ ...commentPopup, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setCommentPopup({ ...commentPopup, open: false })}
          severity={commentPopup.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {commentPopup.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default React.memo(ChatMessage);
