// ChatMessage.jsx
import React, { useState } from "react";
import { Box, Typography, Avatar } from "@mui/material";
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

// Normalise helpers — work whether the caller already normalised or not
const normalizeVideo = (v) => ({
  title: v.title || v.Title || "",
  url: v.url || v.Url || v.videourl || "",
  thumbnail: v.thumbnail || v.Thumbnail || "",
});

const normalizeImage = (img) => ({
  title: img.title || img.Title || "Reference Image",
  url: img.url || img.Url || "",
  thumbnail: img.thumbnail || img.Url || img.url || "",
});

const normalizePdf = (pdf) => ({
  title: pdf.title || pdf.Title || "Reference PDF",
  link: pdf.link || pdf.Link || pdf.url || "",
});

const ChatMessage = ({
  msg,
  videos_suggestions,
  images_suggestions,
  pdf_suggestions,
  sessionId,
  setSearchQuery,
  handleSend,
}) => {
  const [showAllVideos, setShowAllVideos] = useState(false);
  const [showAllImages, setShowAllImages] = useState(false);
  const [showAllPdfs, setShowAllPdfs] = useState(false);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);

  const isUser = msg.role === "user";
  const { mode } = useThemeMode();

  const [previewMedia, setPreviewMedia] = useState({
    open: false,
    type: null,
    src: null,
  });

  const openPreview = (type, src) => setPreviewMedia({ open: true, type, src });
  const closePreview = () => setPreviewMedia({ open: false, type: null, src: null });

  const handleFollowUpQuestion = async (query) => {
    setSearchQuery(query);
    await handleSend(query);
  };

  // Always normalise regardless of which shape the parent passed down
  const normalizedVideos = (videos_suggestions || [])
    .map(normalizeVideo)
    .filter((v) => v.url);
  const normalizedImages = (images_suggestions || [])
    .map(normalizeImage)
    .filter((img) => img.url); // ✅ only keep valid images
  const normalizedPdfs = (pdf_suggestions || [])
    .map(normalizePdf)
    .filter((p) => p.link);

  // question_suggestions lives directly on msg (stored there by handleSend)
  const questionSuggestions = msg.question_suggestions || [];

  // Check if media should be shown (only after content is fully loaded)
  const shouldShowMedia = msg.mediaLoaded !== false && msg.content && msg.content.length > 0;

  // Check if questions should be shown (only after content is fully loaded)
  const shouldShowQuestions = msg.mediaLoaded !== false && questionSuggestions.length > 0;

  const getFormattedTime = (timestamp) => {
    if (!timestamp) return ""; // or "Now"

    const date = new Date(timestamp);

    if (isNaN(date.getTime())) return ""; // avoid Invalid Date

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ── Shared card sx ────────────────────────────────────────────────────────
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
    "&:hover": {
      borderColor: "primary.main",
      transform: "translateY(-2px)",
    },
  };

  const showMoreSx = {
    mt: 1,
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "text.primary",
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

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
        flexDirection: isUser ? "row-reverse" : "row",
      }}
    >
      {/* ── Avatar ────────────────────────────────────────────────────────── */}
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

      {/* ── Content column ────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: isUser ? "auto" : "90%",
          maxWidth: "90%",
          gap: 1,
        }}
      >
        {/* Name + timestamp */}
        {isUser ? (
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "text.heading1" }}>
              You
            </Typography>
            <Typography variant="caption" sx={{ color: "text.caption" }}>
              {getFormattedTime(msg?.timestamp)}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Typography variant="body1" sx={{ fontWeight: 700, color: "text.heading1" }}>
              Dolphin AI
            </Typography>
            <Typography variant="caption" sx={{ color: "text.caption" }}>
              {new Date(msg?.timestamp).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </Typography>
          </Box>
        )}

        {/* ── Bubble */}
        <Box
          sx={{
            bgcolor: isUser ? "background.light" : "background.chatbackground",
            p: 2,
            borderRadius: 5,
            whiteSpace: "pre-wrap",
          }}
        >
          {/* Message body */}
          {isUser ? (
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              {msg.content}
            </Typography>
          ) : msg.category !== "QUIZ" ? (
            <div
              style={{ display: "flex", flexDirection: "column" }}
              dangerouslySetInnerHTML={{ __html: sanitizeMarkdown(msg.content) }}
            />
          ) : (
            <QuizDisplay quizContet={msg.content} />
          )}



          {/* ── Video Suggestions (only after content is fully shown) ───────────────────────────*/}
          {!isUser && shouldShowMedia && normalizedVideos.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                <VideoIcon size={30} color={mode === "dark" ? "#e8f1fb" : "#0f1c2e"} />
                <Typography variant="h3" sx={{ color: "text.primary" }}>
                  Video Suggestions
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
                {normalizedVideos.map((video, i) => (
                  <Box
                    key={i}
                    sx={mediaCardSx}
                    onClick={() => openPreview("video", video.url)}
                  >
                    <Box
                      component="img"
                      src={video.thumbnail}
                      alt={video.title}
                      sx={mediaThumbnailSx}
                    />
                    {/* Play icon overlay */}
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

              {normalizedVideos.length > 4 && (
                <Typography
                  onClick={() => setShowAllVideos((p) => !p)}
                  variant="body1"
                  sx={showMoreSx}
                >
                  {showAllVideos ? "Show less" : "Show more"}
                  {showAllVideos ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </Typography>
              )}
            </Box>
          )}
          {/* ── Reference PDFs (only after content is fully shown) ─────────────────────────────*/}
          {shouldShowMedia && normalizedPdfs.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                <DocumentIcon size={25} color={mode === "dark" ? "#e8f1fb" : "#0f1c2e"} />
                <Typography variant="h3" sx={{ color: "text.primary" }}>
                  Reference PDFs
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexWrap: "wrap",
                  maxHeight: showAllPdfs ? "none" : { xs: 155, sm: 185 },
                  overflow: "hidden",
                  py: 1,
                }}
              >
                {normalizedPdfs.map((pdf, i) => (
                  <Box
                    key={i}
                    sx={mediaCardSx}
                    onClick={() => openPreview("pdf", pdf.link)}
                  >
                    <Box
                      sx={{
                        width: "100%",
                        height: { xs: 100, sm: 130 },
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "background.paper",
                        fontSize: 40,
                      }}
                    >
                      📄
                    </Box>
                    <Typography variant="caption" sx={mediaCaptionSx}>
                      {pdf.title}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {normalizedPdfs.length > 4 && (
                <Typography
                  onClick={() => setShowAllPdfs((p) => !p)}
                  variant="body1"
                  sx={showMoreSx}
                >
                  {showAllPdfs ? "Show less" : "Show more"}
                  {showAllPdfs ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </Typography>
              )}
            </Box>
          )}

          {/* ── Follow-up question suggestions (only after content is fully shown) ──────────────────────────────*/}
          {shouldShowQuestions && (
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography
                variant="body1"
                sx={{ color: "text.primary", fontWeight: 600, letterSpacing: "0.08em" }}
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
                    <Typography variant="body2">{q}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      <MediaPreviewModal
        open={previewMedia.open}
        type={previewMedia.type}
        src={previewMedia.src}
        onClose={closePreview}
      />
    </Box>
  );
};

export default React.memo(ChatMessage);