import React, { useState } from "react";
import { Box, Typography, Avatar } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import QuizDisplay from "./QuizDisplay";
import { sanitizeMarkdown } from "./ChatWindow";
import DolphinIconW from "../../assets/images/dolphin_w.png";
import {
  useThemeMode,
} from "../../context/ThemeModeContext";

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
  const isUser = msg.role === "user";
  const { mode } = useThemeMode();

const handleFollowUpQuestion = async (query) => {
  setSearchQuery(query);     // updates UI (optional)
  await handleSend(query);   // ✅ always correct
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
      {isUser ? (
        <Avatar
          sx={{
            width: 50,
            height: 50,
            backgroundColor: "primary.main",
          }}
        />
      ) : (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: 50,
            height: 50,
            borderRadius: 60,
            backgroundColor: "primary.main",
          }}
        >
          <Box
            component="img"
            src={DolphinIconW}
            alt="Dolphin"
            sx={{ width: 30, height: 30 }}
          />
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: isUser ? "auto" : "90%",
          maxWidth: "90%",
          gap: 1,
        }}
      >
        {isUser ? (
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Typography
              variant="h3"
              sx={{ fontSize: 16, fontWeight: 700, color: "text.heading1" }}
            >
              You
            </Typography>{" "}
            <Typography
              variant="caption"
              sx={{ color: "text.caption", fontSize: 14 }}
            >
              {new Date(msg?.timestamp).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Typography
              variant="h3"
              sx={{ fontSize: 16, fontWeight: 700, color: "text.heading1" }}
            >
              Dolphin
            </Typography>
            <Typography
              variant="h3"
              sx={{ fontSize: 16, fontWeight: 700, color: "text.heading1" }}
            >
              |
            </Typography>
            <Typography
              variant="h3"
              sx={{ fontSize: 16, fontWeight: 700, color: "primary.main" }}
            >
              AI
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "text.caption", fontSize: 14 }}
            >
              {new Date(msg?.timestamp).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            bgcolor: isUser ? "background.light" : "background.chatbackground",
            p: 2,
            borderRadius: 5,
            whiteSpace: "pre-wrap",
          }}
        >
          {isUser ? (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {msg.content}
            </Typography>
          ) : msg.category !== "QUIZ" ? (
            <div
              dangerouslySetInnerHTML={{
                __html: sanitizeMarkdown(msg.content),
              }}
            />
          ) : (
            <QuizDisplay quizContet={msg.content} />
          )}

          {videos_suggestions?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 1.5, opacity: 0.85 }}>
                🎬 Video Suggestions
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  flexWrap: "wrap",
                  maxHeight: showAllVideos ? "none" : 220,
                  overflow: "hidden",
                  transition: "max-height 0.3s ease",
                }}
              >
                {msg.video_suggestions.map((video, i) => (
                  <Box
                    key={i}
                    component="a"
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      width: 220,
                      textDecoration: "none",
                      borderRadius: 2,
                      p: 0.5,
                      background: "rgba(255,255,255,0.05)",
                      transition: "0.2s",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        border: "1px solid #d8e2ec",
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src={video.thumbnail}
                      alt={video.title}
                      sx={{ width: "100%", borderRadius: 1 }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ textAlign: "center", mt: 0.5 }}
                    >
                      {video.title}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {msg.video_suggestions.length > 3 && (
                <Typography
                  onClick={() => setShowAllVideos((prev) => !prev)}
                  sx={{
                    mt: 1,
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "primary.main",
                  }}
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

          {images_suggestions?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 1.5, opacity: 0.85 }}>
                🖼️ Reference Images
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  flexWrap: "wrap",
                  maxHeight: showAllImages ? "none" : 240,
                  overflow: "hidden",
                  transition: "max-height 0.3s ease",
                }}
              >
                {images_suggestions.map((img, i) => (
                  <Box
                    key={i}
                    component="a"
                    href={img.Url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      width: 220,
                      textDecoration: "none",
                      borderRadius: 2,
                      p: 0.5,
                      background: "rgba(255,255,255,0.05)",
                      transition: "0.2s",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        border: "1px solid #d8e2ec",
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src={img.thumbnail || img.Url}
                      alt={img.Title || "image"}
                      sx={{
                        width: "100%",
                        borderRadius: 1,
                        objectFit: "cover",
                      }}
                    />
                    {img.Title && (
                      <Typography
                        variant="body2"
                        sx={{ textAlign: "center", mt: 0.5 }}
                      >
                        {img.Title}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>

              {images_suggestions.length > 3 && (
                <Typography
                  onClick={() => setShowAllImages((prev) => !prev)}
                  sx={{
                    mt: 1,
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "primary.main",
                  }}
                >
                  {showAllImages ? "Show less" : "Show more"}
                  {showAllImages ? (
                    <KeyboardArrowUpIcon />
                  ) : (
                    <KeyboardArrowDownIcon />
                  )}
                </Typography>
              )}
            </Box>
          )}

          {pdf_suggestions?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 1.5, opacity: 0.85 }}>
                📄 Reference PDFs
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  flexWrap: "wrap",
                  maxHeight: showAllPdfs ? "none" : 200,
                  overflow: "hidden",
                  transition: "max-height 0.3s ease",
                }}
              >
                {pdf_suggestions.map((pdf, i) => (
                  <Box
                    key={i}
                    component="a"
                    href={pdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      width: 220,
                      textDecoration: "none",
                      borderRadius: 2,
                      p: 1,
                      background: "#f8fafc",
                      border: "1px solid #e5e7eb",
                      transition: "0.2s",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        borderColor: "#2f6fed",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        height: 120,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 40,
                      }}
                    >
                      📄
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{ textAlign: "center", mt: 0.5 }}
                    >
                      {pdf.title || "PDF Document"}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {pdf_suggestions.length > 3 && (
                <Typography
                  onClick={() => setShowAllPdfs((prev) => !prev)}
                  sx={{
                    mt: 1,
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "primary.main",
                  }}
                >
                  {showAllPdfs ? "Show less" : "Show more"}
                  {showAllPdfs ? (
                    <KeyboardArrowUpIcon />
                  ) : (
                    <KeyboardArrowDownIcon />
                  )}
                </Typography>
              )}
            </Box>
          )}

          {msg.question_suggestions?.length > 0 && (
            <Box
              sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}
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
                {" "}
                {msg.question_suggestions.map((q, i) => (
                  <Box
                    key={i}
                    sx={(theme) => ({
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "auto",
                      p: 1,
                      borderRadius: 3,
                      backgroundColor: "background.light",
                      cursor: "pointer",
                      transition: "all 0.2s ease",

                      "&:hover": {
                        border: "1.5px solid",
                        borderColor: theme.palette.primary.main,
                        color: theme.palette.primary.main,
                      },
                    })}
                    onClick={() => {
                      handleFollowUpQuestion(q);
                    }}
                  >
                    <Typography variant="body2">{q}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default React.memo(ChatMessage);
