import {
  Box,
  Typography,
  IconButton,
  TextareaAutosize,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { SendIcon } from "../../assets/svgIcons/sendIcon";
import { marked } from "marked";
import DOMPurify from "dompurify";
import WelcomeChatScreen from "./WelcomeChatScreen";
import { ensureSession, sendMessage } from "../../api/fetchApi";
import ChatMessage from "./ChatMessage";

export const sanitizeMarkdown = (markdownText) => {
  const rawHtml = marked.parse(markdownText || "");
  return DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
};

const ThinkingBubble = () => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1,
      // p: 2,
      borderRadius: 2,
      width: "fit-content",
    }}
  >
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        backgroundColor: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      🐬
    </Box>
    <Typography variant="body1"
      sx={{ fontWeight: 500, color: "var(--marine-deep)", backgroundColor: "#fff", p: 2,borderRadius:2 }}
    >
      Dolphin is thinking...
    </Typography>
  </Box>
);

const ChatWindow = ({
  currentSessionData,
  currentSessionId,
  setCurrentSessionId,
  activeIndex,
  loading,
  fetchSessions,
}) => {
  const [messages, setmessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setmessages(
      Array.isArray(currentSessionData?.messages)
        ? currentSessionData.messages
        : []
    );
  }, [currentSessionData]);

  const handleSend = async () => {
    if (!searchQuery.trim()) return;

    const userMessage = {
      role: "user",
      content: searchQuery.trim(),
      timestamp: new Date().toISOString(),
    };

    setmessages((prev = []) => [...prev, userMessage]);
    setSearchQuery("");

    // 🐬 thinking bubble
    setmessages((prev = []) => [
      ...prev,
      { role: "assistant", isThinking: true },
    ]);

    const sessionId = currentSessionId
      ? await ensureSession(currentSessionId)
      : await ensureSession();

    setCurrentSessionId(sessionId);

    const response = await sendMessage(sessionId, userMessage.content);

    setmessages((prev = []) =>
      prev
        .filter((m) => !m.isThinking)
        .concat({
          ...response,
          category: response?.metadata?.category,
          role: "assistant",
        })
    );

    await fetchSessions();
  };

  const showWelcome =
    (currentSessionData && currentSessionData.messages?.length === 0) ||
    messages?.length === 0 ||
    (activeIndex === null && !currentSessionId);

  return (
    <Box
      sx={{
        width: "80vw",
        background: '#f4f0ea',
        display: "flex",
        flexDirection: "column",
      }}
    >
      {showWelcome ? (
        <WelcomeChatScreen />
      ) : (
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 8,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {messages?.map((msg, index) => {
            const videos_suggestions =
              msg?.videos ||
              msg?.video_suggestions ||
              msg?.metadata?.videos ||
              [];
            const images_suggestions =
              msg?.images || msg?.metadata?.images || [];
            const pdf_suggestions = msg?.pdfs || msg?.metadata?.pdfs || [];

            return msg.isThinking ? (
              <ThinkingBubble key="thinking" />
            ) : (
              <ChatMessage
                msg={msg}
                videos_suggestions={videos_suggestions}
                images_suggestions={images_suggestions}
                pdf_suggestions={pdf_suggestions}
              />
            );
          })}
        </Box>
      )}

      <Box
        sx={{
          p: 5,
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          <TextareaAutosize
            minRows={1}
            maxRows={6}
            placeholder="Ask about nutrition, calories, fitness..."
            style={{
              width: "100%",
              resize: "none",
              borderRadius: 10,
              padding: "20px 56px 20px 15px",
              fontSize: 14,
              fontFamily: "inherit",
              maxHeight: "120px",
              overflowY: "auto",
              boxSizing: "border-box",
              border: "1px solid #c4c4c4",
              outline: "none",

              scrollbarWidth: "thin",
              scrollbarColor: "#b0c7d8 transparent",

              "&::-webkit-scrollbar": {
                width: "6px",
              },

              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#b0c7d8",
                borderRadius: "10px",
              },

              "&::-webkit-scrollbar-button:single-button": {
                display: "none",
                width: 0,
                height: 0,
              },

              "&::-webkit-scrollbar-button:vertical:start:decrement": {
                display: "none",
              },
              "&::-webkit-scrollbar-button:vertical:end:increment": {
                display: "none",
              },
            }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <IconButton
            onClick={handleSend}
            sx={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              height: 36,
              width: 36,
              bgcolor: "#cbe1f1ff",
              borderRadius: 2,
              "&:hover": {
                bgcolor: "#9fc3ddff",
              },
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatWindow;
