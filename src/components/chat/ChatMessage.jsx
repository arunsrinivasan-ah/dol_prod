import React, { useState } from "react";
import { Box, Typography, Avatar } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import QuizDisplay from "./QuizDisplay";
import { sanitizeMarkdown } from "./ChatWindow";

const ChatMessage = ({
  msg,
  videos_suggestions,
  images_suggestions,
  pdf_suggestions,
}) => {
  const [showAllVideos, setShowAllVideos] = useState(false);
  const [showAllImages, setShowAllImages] = useState(false);
  const [showAllPdfs, setShowAllPdfs] = useState(false);
  const isUser = msg.role === "user";

  console.log("qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",videos_suggestions);
  console.log("qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",images_suggestions);
  console.log("qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",pdf_suggestions);
  

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
        <Avatar sx={{ width: 36, height: 36 }} />
      ) : (
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            backgroundColor: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          🐬
        </Box>
      )}

      <Box
        sx={{
          width: isUser ? "auto" : "90%",
          maxWidth: "90%",
          bgcolor: isUser ? "#e2e6e8ff" : "#fff",
          p: 2,
          borderRadius: 2,
          whiteSpace: "pre-wrap",
        }}
      >
        {isUser ? (
          <Typography>{msg.content}</Typography>
        ) : msg.category != "QUIZ" ? (
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
                       border:"1px solid #d8e2ec"
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
                      border:"1px solid #d8e2ec"
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
                  {/* PDF icon */}
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
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: "#6b7280",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Follow-up questions
            </Typography>

            {msg.question_suggestions.map((q, i) => (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1,
                  borderRadius: 2,
                  backgroundColor: "#ffffff",
                  border: "1px solid #e6eaf0",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "#f5f9fd",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    border: "1px solid #2f6fed",
                    color: "#2f6fed",
                    "& .followup-text": { color: "#2f6fed" },
                    "& .followup-arrow": {
                      color: "#2f6fed",
                      transform: "translateX(2px)",
                    },
                  },
                }}
              >
                <Box sx={{ display: "flex", gap: 1,alignItems:"center" }}>
                  <HelpOutlineIcon sx={{ fontSize: 16 }} />
                  <Typography variant="body2" className="followup-text">
                    {q}
                  </Typography>
                </Box>
                <ChevronRightIcon className="followup-arrow" />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default React.memo(ChatMessage);
