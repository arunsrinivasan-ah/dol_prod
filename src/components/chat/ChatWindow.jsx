// ChatWindow.jsx
import {
  Box,
  Typography,
  IconButton,
  TextareaAutosize,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { SendIcon } from "../../assets/svgIcons/sendIcon";
import { marked } from "marked";
import DOMPurify from "dompurify";
import WelcomeChatScreen from "./WelcomeChatScreen";
import { ensureSession, sendMessage, saveSession, getSavedSessions } from "../../api/fetchApi";
import ChatMessage from "./ChatMessage";
import { useThemeMode } from "../../context/ThemeModeContext";
import { Message } from "../../assets/svgIcons/message";
import { Saveoutlined } from "../../assets/svgIcons/SaveIconOutlined";
import DolphinIconW from "../../assets/images/dolphin_w.png";
import { getContentWidth } from "../../theme/layoutScale";
import { Dialog, DialogContent, DialogActions, Button } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";


export const sanitizeMarkdown = (markdownText) => {
  if (!markdownText) return "";
  const cleaned = markdownText
    .replace(/^#{1,6}\s*\n/gm, "")
    .replace(/^\s{2,}/gm, "");
  const rawHtml = marked.parse(cleaned);
  return DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
};

const normalizeVideo = (v) => ({
  title: v.title || v.Title || "",
  url: v.url || v.Url || v.videourl || "",
  thumbnail: v.thumbnail || v.Thumbnail || "",
});
const normalizeImage = (img) => ({
  title: img.title || img.Title || img.About || "Reference Image",
  url: img.url || img.Url || "",
  thumbnail: img.thumbnail || img.Url || img.url || "",
});
const normalizePdf = (pdf) => ({
  title: pdf.title || pdf.Title || "Reference PDF",
  link: pdf.link || pdf.Link || pdf.url || "",
});


const EMPTY_LIVE = {
  active: false,
  content: "",
  suggestions: [],
  media: { videos: [], images: [], pdfs: [] },
};


const ChatWindow = ({
  currentSessionData,
  currentSessionId,
  setCurrentSessionId,
  activeIndex,
  messages,
  setmessages,
  setDisableNewChat,
  fetchSessions,
  setActiveIndex,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [liveMessage, setLiveMessage] = useState(EMPTY_LIVE);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  const { mode, fontLevel } = useThemeMode();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isStoppedRef = useRef(false);
  const userScrolledRef = useRef(false);
  const [savedSessions, setSavedSessions] = useState([]);

  const [saveDialog, setSaveDialog] = useState({
    open: false,
    message: "",
    isError: false,
  });

  // ── Accumulator ref ───────────────────────────────────────────────────────
  const accRef = useRef({
    content: "",
    suggestions: [],
    media: { videos: [], images: [], pdfs: [] },
  });


  useEffect(() => {
    setmessages(
      Array.isArray(currentSessionData?.messages)
        ? currentSessionData.messages
        : []
    );
  }, [currentSessionData, setmessages]);


  useEffect(() => {
    if (!autoScrollEnabled) return;
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, liveMessage.content, liveMessage.active, autoScrollEnabled]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distFromBottom > 80) {
        userScrolledRef.current = true;
        setAutoScrollEnabled(false);
      } else {
        userScrolledRef.current = false;
        setAutoScrollEnabled(true);
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  const isCurrentSaved = savedSessions.some(
    (s) => s.session_id === currentSessionId
  );
  useEffect(() => {
    const loadSaved = async () => {
      try {
        const res = await getSavedSessions();
        setSavedSessions(res.saved_sessions || []);
      } catch (err) {
        console.error("Failed to load saved sessions", err);
      }
    };

    loadSaved();
  }, []);


  const handleStop = useCallback(() => {
    isStoppedRef.current = true;
    abortControllerRef.current?.abort();

    const partial = accRef.current.content.trim();
    if (partial) {
      setmessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: partial,
          videos: accRef.current.media.videos,
          images: accRef.current.media.images,
          pdfs: accRef.current.media.pdfs,
          question_suggestions: accRef.current.suggestions,
          timestamp: new Date().toISOString(),
          mediaLoaded: true,
        },
      ]);
    }
    setLiveMessage(EMPTY_LIVE);
    setIsStreaming(false);
    setDisableNewChat(false);
  }, [setmessages, setDisableNewChat]);

  const handleSend = useCallback(async (queryOverride) => {
    if (isStreaming) return;

    const messageText = (queryOverride ?? searchQuery).trim();
    if (!messageText) return;

    // ── Reset accumulator ──────────────────────────────────────────────────
    isStoppedRef.current = false;
    accRef.current = {
      content: "",
      suggestions: [],
      media: { videos: [], images: [], pdfs: [] },
    };

    // Add user message instantly
    setmessages((prev = []) => [
      ...prev,
      { role: "user", content: messageText, timestamp: new Date().toISOString() },
    ]);

    setSearchQuery("");
    setIsStreaming(true);
    setDisableNewChat(true);
    setAutoScrollEnabled(true);
    userScrolledRef.current = false;

    // Activate live message area (shows thinking bubble)
    setLiveMessage({ ...EMPTY_LIVE, active: true });

    try {
      // ── Ensure session ────────────────────────────────────────────────────
      const sessionId = currentSessionId
        ? await ensureSession(currentSessionId)
        : await ensureSession();

      setCurrentSessionId(sessionId);

      if (!currentSessionId && fetchSessions) {
        await fetchSessions();
        setActiveIndex?.(0);
      }

      abortControllerRef.current = new AbortController();

      // ── Start SSE stream ──────────────────────────────────────────────────
      await sendMessage(
        sessionId,
        messageText,
        abortControllerRef.current.signal,
        {
          // Content tokens — grow the live bubble word by word
          onContentToken: (token) => {
            if (isStoppedRef.current) return;
            accRef.current.content += token;
            setLiveMessage((prev) => ({
              ...prev,
              active: true,
              content: accRef.current.content,
            }));
          },

          onSuggestions: (suggestions) => {
            if (isStoppedRef.current) return;
            accRef.current.suggestions = suggestions;
            setLiveMessage((prev) => ({ ...prev, suggestions }));
          },

          onMedia: (rawMedia) => {
            if (isStoppedRef.current) return;
            accRef.current.media = {
              videos: (rawMedia.videos || []).map(normalizeVideo),
              images: (rawMedia.images || []).map(normalizeImage),
              pdfs: (rawMedia.pdfs || []).map(normalizePdf),
            };
            setLiveMessage((prev) => ({ ...prev, media: accRef.current.media }));
          },

          onError: (msg) => {
            if (isStoppedRef.current) return;
            console.error("SSE error:", msg);
            setmessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: "Sorry, something went wrong. Please try again.",
                timestamp: new Date().toISOString(),
                videos: [],
                images: [],
                pdfs: [],
                question_suggestions: [],
                mediaLoaded: true,
              },
            ]);
            setLiveMessage(EMPTY_LIVE);
            setIsStreaming(false);
            setDisableNewChat(false);
          },

          // Stream complete — commit live message into the messages array
          onDone: () => {
            if (isStoppedRef.current) return;
            const acc = accRef.current;
            setmessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: acc.content,
                videos: acc.media.videos,
                images: acc.media.images,
                pdfs: acc.media.pdfs,
                question_suggestions: acc.suggestions,
                timestamp: new Date().toISOString(),
                mediaLoaded: true,
              },
            ]);
            setLiveMessage(EMPTY_LIVE);
            setIsStreaming(false);
            setDisableNewChat(false);
            fetchSessions?.();
          },
        }
      );

    } catch (err) {
      if (err.name === "AbortError" || err.name === "CanceledError") return;
      console.error("handleSend error:", err);
      setmessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          timestamp: new Date().toISOString(),
          videos: [],
          images: [],
          pdfs: [],
          question_suggestions: [],
          mediaLoaded: true,
        },
      ]);
      setLiveMessage(EMPTY_LIVE);
      setIsStreaming(false);
      setDisableNewChat(false);
    }
  }, [
    isStreaming, searchQuery, currentSessionId,
    setmessages, setCurrentSessionId, setDisableNewChat,
    fetchSessions, setActiveIndex,
  ]);

  const handleSaveChat = async () => {
    if (!currentSessionId) {
      setSaveDialog({
        open: true,
        message: "No session to save",
        isError: true,
      });
      return;
    }

    try {
      const res = await saveSession(currentSessionId);

      if (res.is_saved) {
        setSaveDialog({
          open: true,
          message: "Chat saved successfully",
          isError: false,
        });

        //  THIS IS THE REAL FIX
        //  immediate UI update + backend sync
        await fetchSessions?.();

        //  FORCE REFRESH using saved API
        const savedRes = await getSavedSessions();

        const savedIds = new Set(
          (savedRes.saved_sessions || []).map((s) => s.session_id)
        );

        //  Update sessionData manually (IMPORTANT)
        fetchSessions?.(undefined, (prevSessions) =>
          prevSessions.map((s) => ({
            ...s,
            is_saved: savedIds.has(s.session_id),
          }))
        );
      }

    } catch (err) {
      setSaveDialog({
        open: true,
        message: "Failed to save chat",
        isError: true,
      });
    }
  };


  const ThinkingBubble = () => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, borderRadius: 5, width: "fit-content" }}>
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
        <Box component="img" src={DolphinIconW} alt="Dolphin" sx={{ width: 30, height: 30 }} />
      </Box>
      <Typography
        variant="body1"
        sx={{
          fontWeight: 700,
          backgroundColor: "background.chatbackground",
          p: 1.5,
          borderRadius: 5,
          color: "primary.main",
          "& span": { fontSize: 20, animation: "blink 1.4s infinite both" },
          "& span:nth-of-type(2)": { animationDelay: "0.2s" },
          "& span:nth-of-type(3)": { animationDelay: "0.4s" },
          "@keyframes blink": {
            "0%": { opacity: 0 },
            "20%": { opacity: 1 },
            "100%": { opacity: 0 },
          },
        }}
      >
        Dolphin is thinking<span>.</span><span>.</span><span>.</span>
      </Typography>
    </Box>
  );


  const showWelcome =
    !liveMessage.active &&
    (messages?.length === 0 || !messages) &&
    (activeIndex === null && !currentSessionId);

  const showThinking = liveMessage.active && !liveMessage.content;
  const showLiveContent = liveMessage.active && !!liveMessage.content;

  return (
    <Box
      sx={{
        width: { xs: "100vw", md: getContentWidth(fontLevel) },
        backgroundColor: "background.light1",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          px: { xs: 1.5, sm: 4, md: 7 },
          py: { xs: 1, md: 2 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: { xs: "50%", md: "80%" } }}>
          <Message size={22} color={mode === "dark" ? "#1cb0f6" : "#106BA3"} />
          <Typography
            variant="h4"
            sx={{
              color: "text.primary",
              width: "80%",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontWeight: 700,
            }}
          >
            {currentSessionData
              ? currentSessionData?.title?.charAt(0)?.toUpperCase() +
              currentSessionData?.title?.slice(1)
              : "New Chat"}
          </Typography>
        </Box>


        <Box
          onClick={!isCurrentSaved ? handleSaveChat : undefined}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            cursor: isCurrentSaved ? "not-allowed" : "pointer",
            opacity: isCurrentSaved ? 0.5 : 1,
            pointerEvents: isCurrentSaved ? "none" : "auto",
          }}
        >
          <Saveoutlined
            size={22}
            color={mode === "dark" ? "#1cb0f6" : "#106BA3"}
          />

          <Typography
            variant="body1"
            sx={{ color: "text.primary", fontWeight: 500 }}
          >
            {isCurrentSaved ? "Saved Chat" : "Save Chat"}
          </Typography>
        </Box>

        {/* <Box sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }}>
          <Saveoutlined size={22} color={mode === "dark" ? "#1cb0f6" : "#106BA3"} />
          <Typography variant="body1" onClick={handleSaveChat} sx={{ color: "text.primary" }}>Save Chat</Typography>
        </Box> */}
      </Box>

      {/* ── Message list */}
      {showWelcome ? (
        <WelcomeChatScreen handleSend={handleSend} setSearchQuery={setSearchQuery} />
      ) : (
        <Box
          ref={containerRef}
          onWheel={() => {
            userScrolledRef.current = true;
            setAutoScrollEnabled(false);
          }}
          onTouchMove={() => {
            userScrolledRef.current = true;
            setAutoScrollEnabled(false);
          }}
          sx={{
            flex: 1,
            overflowY: "auto",
            pt: 1,
            pb: 2,
            px: { xs: 1, md: 5 },
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {/* ── Committed messages ──────────────────────────────────────────── */}
          {messages?.map((msg, index) => (
            <ChatMessage
              key={index}
              handleSend={handleSend}
              setSearchQuery={setSearchQuery}
              sessionId={currentSessionId}
              msg={msg}
              videos_suggestions={msg?.videos || msg?.video_suggestions || []}
              images_suggestions={msg?.images || msg?.metadata?.images || []}
              pdf_suggestions={msg?.pdfs || msg?.metadata?.pdfs || []}
            />
          ))}

          {/* ── Live streaming area ─────────────────────────────────────────── */}
          {liveMessage.active && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>

              {/* Thinking bubble — shown while waiting for first token */}
              {showThinking && <ThinkingBubble />}

              {/* Live answer — grows word by word as tokens arrive */}
              {showLiveContent && (
                <ChatMessage
                  key="live-answer"
                  handleSend={handleSend}
                  setSearchQuery={setSearchQuery}
                  sessionId={currentSessionId}
                  msg={{
                    role: "assistant",
                    content: liveMessage.content,
                    mediaLoaded: false,
                    timestamp: new Date().toISOString(),
                  }}
                  videos_suggestions={[]}
                  images_suggestions={[]}
                  pdf_suggestions={[]}
                />
              )}
            </Box>
          )}

          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </Box>
      )}

      {/* ── Input bar ──────────────────────────────────────────────────────── */}
      <Box
        sx={{
          px: { xs: 1, sm: 4, md: 7 },
          py: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            display: "flex",
            alignItems: "center",
            "& textarea": {
              width: "100%",
              resize: "none",
              borderRadius: 2,
              padding: "20px 56px 20px 50px",
              fontSize: 14,
              fontFamily: "inherit",
              maxHeight: 120,
              overflowY: "auto",
              boxSizing: "border-box",
              backgroundColor: "background.paper",
              color: "text.primary",
              border: "1px solid",
              borderColor: "divider",
              outline: "none",
              scrollbarWidth: "thin",
              scrollbarColor: "primary.main transparent",
              "&::placeholder": { color: "text.placeholder1", opacity: 1 },
              "&::-webkit-scrollbar": { width: 6 },
              "&::-webkit-scrollbar-thumb": { backgroundColor: "primary.main", borderRadius: 2 },
              "&::-webkit-scrollbar-button": { display: "none" },
            },
          }}
        >
          <TextareaAutosize
            minRows={1}
            maxRows={6}
            placeholder="Message Dolphin AI"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (isStreaming) return;
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          {/* Left icon */}
          <Box
            sx={{
              display: "flex",
              position: "absolute",
              transform: "translateY(-50%)",
              left: 16,
              top: "50%",
            }}
          >
            <Message size={22} color={mode === "dark" ? "#1cb0f6" : "#106BA3"} />
          </Box>

          {/* Send / Stop button */}
          <IconButton
            onClick={isStreaming ? handleStop : () => handleSend()}
            sx={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              height: 36,
              width: 36,
              borderRadius: 2,
            }}
          >
            {isStreaming ? (
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: "green",
                  borderRadius: 1,
                }}
              />
            ) : (
              <SendIcon size={20} color={mode === "dark" ? "#1989D0" : "#106BA3"} />
            )}
          </IconButton>
        </Box>

        <Typography
          variant="caption"
          sx={{ fontWeight: 500, textAlign: "center", p: 1, color: "text.caption" }}
        >
          This AI-generated content is for educational purposes only and may not
          reflect the most current regulations or company policies. Always verify
          with official sources and your organization's safety management system
          (SMS) before applying in practice.
        </Typography>
      </Box>

      <Dialog
        open={saveDialog.open}
        onClose={() => setSaveDialog({ ...saveDialog, open: false })}
        maxWidth="xs"
        fullWidth
        BackdropProps={{
          sx: {
            backdropFilter: "blur(6px)",   //  blur background
            backgroundColor: "rgba(0,0,0,0.2)", // optional dark overlay
          },
        }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            backdropFilter: "blur(10px)",  //  glass effect on dialog
            background: "rgba(255, 255, 255, 0.8)", // light glass
          },
        }}
      >
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 4,
            px: 3,
            textAlign: "center",
          }}
        >
          {/* ✅ Icon */}
          {saveDialog.isError ? (
            <ErrorIcon sx={{ fontSize: 50, color: "error.main", mb: 1 }} />
          ) : (
            <CheckCircleIcon sx={{ fontSize: 50, color: "#1cb0f6", mb: 1 }} />
          )}

          {/* ✅ Message */}
          <Typography
            variant="body1"
            sx={{
              mt: 1,
              fontWeight: 500,
              color: "text.primary",
            }}
          >
            {saveDialog.message}
          </Typography>
        </DialogContent>

        {/* ✅ Square Button */}
        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <Button
            onClick={() => setSaveDialog({ ...saveDialog, open: false })}
            variant="contained"
            sx={{
              width: 100,
              height: 40,
              borderRadius: 1,   // 🔥 square shape
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatWindow;