import {
  Box,
  Typography,
  IconButton,
  TextareaAutosize,
  CircularProgress,
} from "@mui/material";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { SendIcon } from "../../assets/svgIcons/sendIcon";
import { marked } from "marked";
import DOMPurify from "dompurify";
import WelcomeChatScreen from "./WelcomeChatScreen";
import {
  ensureSession,
  sendMessage,
  saveSession,
  getSavedSessions,
  submitMessageFeedback,
  fetchTopicDetails,
} from "../../api/fetchApi";
import ChatMessage, { markdownContainerSx } from "./ChatMessage";
import { useThemeMode } from "../../context/ThemeModeContext";
import { Message } from "../../assets/svgIcons/message";
import { Saveoutlined } from "../../assets/svgIcons/SaveIconOutlined";
import DolphinIconW from "../../assets/images/dolphin_w.png";
import DolphinIconB from "../../assets/images/dolphin_b.png";
import { getContentWidth } from "../../theme/layoutScale";
import { Dialog, DialogContent, DialogActions, Button } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

const formatGlossaryContent = (content) => {
  if (!content) return "";
  return content.replace(
    /([A-Z][A-Z\s]{2,}):\s*([\s\S]+?)(?=(?:[A-Z][A-Z\s]{2,}:)|$)/g,
    (_, title, desc) =>
      `\n- **${title
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())}**: ${desc.trim()}\n`,
  );
};

export const formatMarkdownContent = (content) => {
  if (!content) return "";

  let formatted = formatGlossaryContent(content);

  // Remove thinking text
  formatted = formatted.replace(/Dolphin is thinking\.\.\./gi, "");

  // Clean up broken inline step linebreaks e.g. (step\n7. and ... -> (step 7) and ...
  formatted = formatted.replace(/\(step\s*[\r\n]+\s*(\d+)[\.\)]?/gi, "(step $1)");
  formatted = formatted.replace(/\(step\s+(\d+)\s*[\r\n]+\s*(\d+)[\.\)]?/gi, "(step $1, $2)");

  // Ensure markdown headings start on new lines with blank lines before & after
  formatted = formatted.replace(/([^\n])\s*(#{1,6}\s+[^\n]+)/g, "$1\n\n$2\n\n");

  // Common standalone section headers (e.g., Advantages, Disadvantages, Precautions, etc.)
  formatted = formatted.replace(
    /(^|\n)\s*(Advantages|Disadvantages|Merits|Demerits|Key Points|Precautions|Procedures|Requirements|Overview|Summary|Safety Controls|Emergency Procedures|Operational Guidelines|Responsibilities|Checklist)(?::|\.?\s*[\n\r]|$)/gi,
    "$1\n\n### $2\n\n",
  );

  // If a title is merged mid-paragraph after a sentence ending period (e.g., "...operation. Unloading Operations The unloading process starts...")
  formatted = formatted.replace(
    /(?<=[.?!])\s+([A-Z][A-Za-z0-9&/\-\s]{2,50}?)\s+(The |This |Accidental |In terms of |During |Before |After |When |It is |These |Proper |Safety |All |Step )/g,
    "\n\n### $1\n\n$2",
  );

  // If a title is at the start of a block/line followed by a sentence (e.g., "Loading and Unloading Procedures Load and Discharge Plan Accidental stress...")
  formatted = formatted.replace(
    /(^|\n{2,})([A-Z][A-Za-z0-9&/\-\s]{2,60}?)\s+(The |This |Accidental |In terms of |During |Before |After |When |It is |These |Proper |Safety |All |Step )/g,
    "$1### $2\n\n$3",
  );

  // Standalone line that looks like a title (Title Cased or with colon, not a list item)
  formatted = formatted.replace(
    /(^|\n{2,})([A-Z][A-Za-z0-9\s,&/\-]{2,50})(?::|\s*\n)\s*(?=[A-Z])/g,
    "$1### $2\n\n",
  );

  // Format numbered lists: ensure "1. ", "2. " start on new lines
  formatted = formatted.replace(/([^\n])[ \t]+(\d+[\.\)])[ \t]+/g, "$1\n$2 ");
  formatted = formatted.replace(/^\s*(\d+)[\.\)]\s+/gm, "$1. ");

  // Bullet lists: ensure "• " or "- " start on new lines
  formatted = formatted.replace(/([^\n])[ \t]+([•\-\*])[ \t]+/g, "$1\n- ");
  formatted = formatted.replace(/^\s*[•\-\*]\s+/gm, "- ");

  // Fix inline numbered steps in parentheses (1) -> 1.
  formatted = formatted.replace(/(?:^|[ \t]+)\((\d+)\)[ \t]+/g, "\n$1. ");

  // Attribution / organization lines in parenthesis e.g. "International Association of Classification Societies Ltd (IACS)." alone on line
  formatted = formatted.replace(
    /(^|\n)\s*([A-Z][A-Za-z\s]+(?:Ltd|Inc|Org|IACS|IMO|SOLAS|MARPOL|STCW|ISGOTT|ICS)\s*(?:\([A-Z0-9]+\))?\.?)\s*($|\n)/g,
    "$1\n> **$2**\n$3",
  );

  // Remove orphan "(" appearing alone on a line
  formatted = formatted.replace(/^\s*\(\s*$/gm, "");

  // Remove trailing "(" at end of a line
  formatted = formatted.replace(/\s+\($/gm, "");

  // Bring source references to the same line as the preceding text
  formatted = formatted.replace(
    /\n+\s*(@@SOURCE_REF_\d+@@|\[\[\s*Ref:?\s*\d+\s*\]\])/gi,
    " $1",
  );

  // Ensure specific terms requested by user are always bolded
  formatted = formatted.replace(/\b(company name|vessel name|course name)\b/gi, "**$1**");

  // Remove excessive blank lines
  formatted = formatted.replace(/\n{3,}/g, "\n\n");

  // Balance unclosed bold and italic markers
  const boldMatches = formatted.match(/\*\*/g);
  if (boldMatches && boldMatches.length % 2 !== 0) {
    formatted += "**";
  }
  const italicMatches = formatted.replace(/\*\*/g, "").match(/\*/g);
  if (italicMatches && italicMatches.length % 2 !== 0) {
    formatted += "*";
  }

  return formatted.trim();
};
export const sanitizeMarkdown = (content, skipFormatting = false) => {
  if (!content) return "";

  let finalContent = skipFormatting ? content : formatMarkdownContent(content);

  const html = marked.parse(finalContent, {
    gfm: true,
    breaks: true,
  });

  return DOMPurify.sanitize(html);
};

// ─── Normalisers ──
const normalizeVideo = (v) => ({
  title: v.title || v.Title || "",
  url: v.url || v.Url || v.videourl || "",
  thumbnail: v.thumbnail || v.Thumbnail || "",
});

const normalizeImage = (img) => {
  const imageSrc = img.base64
    ? `data:image/${img.format || "jpeg"};base64,${img.base64}`
    : img.url || img.Url || "";

  return {
    title: img.title || img.Title,
    url: imageSrc,
    thumbnail: imageSrc,
  };
};

const normalizePdf = (pdf) => ({
  title: pdf.title || pdf.Title || "",
  link: pdf.link || pdf.Link || pdf.url || "",
});

const EMPTY_LIVE = {
  active: false,
  content: "",
  company_content: "",
  suggestions: [],
  media: { videos: [], images: [], pdfs: [] },
  topics: [],
  transcripts: [],
  checkLicCoursesData: null
};

// Factory so we always get a fresh object (avoids accidental mutation sharing)
const EMPTY_ACC = () => ({
  content: "",
  company_content: "",
  suggestions: [],
  media: { videos: [], images: [], pdfs: [] },
  topics: [],
  pendingTopics: [],
  transcripts: [],
  checkLicCoursesData: null,
});

// ─── Component ────
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
  loading,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [liveMessage, setLiveMessage] = useState(EMPTY_LIVE);
  const [showUnderstanding, setShowUnderstanding] = useState(false);
  const [understandingContent, setUnderstandingContent] = useState("");
  const [showThinkingBetween, setShowThinkingBetween] = useState(false);
  const [showInitialThinking, setShowInitialThinking] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [waitingForNextChunk, setWaitingForNextChunk] = useState(false);
  const [showContentGap, setShowContentGap] = useState(false);
  const [showUnderstandingGap, setShowUnderstandingGap] = useState(false);
  const [savedSessions, setSavedSessions] = useState([]);
  const [saveDialog, setSaveDialog] = useState({
    open: false,
    message: "",
    isError: false,
  });

  const [sourcesData, setSourcesData] = useState({
    open: false,
    loading: false,
    topics: [],
    selectedTopicCode: null,
    detailTopic: null,
  });

  // Close the sources panel when a new chat is started
  useEffect(() => {
    if (!currentSessionId && (!messages || messages.length === 0)) {
      setSourcesData((prev) => ({ ...prev, open: false, detailTopic: null }));
    }
  }, [currentSessionId, messages]);

  const { mode, fontLevel } = useThemeMode();

  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const abortControllerRef = useRef(null);
  const alreadyCommittedRef = useRef(false);
  const userScrolledRef = useRef(false);
  const tokenQueueRef = useRef([]);
  const typingIntervalRef = useRef(null);
  const isTypingRef = useRef(false);
  const hasContentStartedRef = useRef(false);
  const understandingDoneRef = useRef(false);
  const understandingReceivedRef = useRef(false);
  const initialThinkingHiddenRef = useRef(false);
  const sidebarLoadedRef = useRef(false);
  const initialThinkingTimeoutRef = useRef(null);
  const accRef = useRef(EMPTY_ACC());
  const understandingAccRef = useRef("");

  // ── Sync session messages ────
  useEffect(() => {
    setmessages(
      Array.isArray(currentSessionData?.messages)
        ? currentSessionData.messages
        : [],
    );
  }, [currentSessionData, setmessages]);

  // ── Auto-scroll ───────
  useEffect(() => {
    if (!autoScrollEnabled) return;
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [
    messages,
    liveMessage.content,
    liveMessage.active,
    autoScrollEnabled,
    understandingContent,
    showUnderstanding,
    showInitialThinking,
    showThinkingBetween,
    showContentGap,
    showUnderstandingGap,
  ]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (dist > 80) {
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

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        if (tokenQueueRef.current && tokenQueueRef.current.length > 0) {
          while (tokenQueueRef.current.length > 0) {
            const nextToken = tokenQueueRef.current.shift();
            if (nextToken.type === 'content') {
              accRef.current.content += nextToken.text;
            } else if (nextToken.type === 'company_content') {
              accRef.current.company_content += nextToken.text;
            }
          }
          setLiveMessage((prev) => ({
            ...prev,
            active: true,
            content: accRef.current.content,
            company_content: accRef.current.company_content,
          }));
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // ── Saved sessions ──
  const isCurrentSaved = savedSessions.some(
    (s) => s.session_id === currentSessionId,
  );

  useEffect(() => {
    getSavedSessions()
      .then((res) => setSavedSessions(res.saved_sessions || []))
      .catch((err) => console.error("Failed to load saved sessions", err));
  }, []);

  // ── Feedback submission handler ──
  const handleFeedbackSubmit = useCallback(async (feedbackData) => {
    try {
      const response = await submitMessageFeedback(feedbackData);
      console.log("Feedback submitted:", feedbackData);
      return response;
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      throw error;
    }
  }, []);

  // ── Shared UI reset (called by both handleStop and onDone/onError) ─────────
  const resetStreamingUI = useCallback(() => {
    setLiveMessage(EMPTY_LIVE);
    setShowUnderstanding(false);
    setUnderstandingContent("");
    setShowInitialThinking(false);
    setShowThinkingBetween(false);
    setWaitingForNextChunk(false);
    setShowContentGap(false);
    setShowUnderstandingGap(false);
    setIsStreaming(false);
    setDisableNewChat(false);
  }, [setDisableNewChat]);

  // Handle topic click
  const handleTopicClick = useCallback(
    async (topicCode, allMessageTopics = []) => {
      setSourcesData((prev) => ({
        ...prev,
        open: true,
        loading: true,
        selectedTopicCode: topicCode,
      }));

      try {
        const data = await fetchTopicDetails(topicCode);
        const clickedIndex = allMessageTopics.indexOf(topicCode);
        const resolvedTopic = {
          code: topicCode,
          index: clickedIndex >= 0 ? clickedIndex + 1 : 1,
          topicName: data.topic_name || topicCode,
          courseName: data.course_name || "",
          content:
            data.topic_content ||
            data.content ||
            data.text ||
            "No content found.",
          _fetched: true,
        };

        setSourcesData((prev) => ({
          ...prev,
          topics: [resolvedTopic],
          totalSources: allMessageTopics.length,
          loading: false,
          detailTopic: null,
        }));
      } catch (err) {
        console.error("Failed to fetch topics details:", err);
        setSourcesData((prev) => ({
          ...prev,
          loading: false,
        }));
      }
    },
    [],
  );

  // ── Send ───
  const handleSend = useCallback(
    async (queryOverride) => {
      if (isStreaming) return;

      const messageText = (queryOverride ?? searchQuery).trim();
      if (!messageText) return;

      alreadyCommittedRef.current = false;
      accRef.current = EMPTY_ACC();
      understandingAccRef.current = "";
      understandingDoneRef.current = false;
      understandingReceivedRef.current = false;
      hasContentStartedRef.current = false;
      initialThinkingHiddenRef.current = false;
      sidebarLoadedRef.current = false;
      tokenQueueRef.current = [];

      if (initialThinkingTimeoutRef.current) {
        clearTimeout(initialThinkingTimeoutRef.current);
        initialThinkingTimeoutRef.current = null;
      }
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }

      setmessages((prev = []) => [
        ...prev,
        {
          role: "user",
          content: messageText,
          timestamp: new Date().toISOString(),
        },
      ]);

      setSearchQuery("");
      setIsStreaming(true);
      setDisableNewChat(true);
      setAutoScrollEnabled(true);
      userScrolledRef.current = false;

      setShowInitialThinking(true);
      setShowUnderstanding(true);
      setUnderstandingContent("");
      setShowThinkingBetween(false);
      setLiveMessage({ ...EMPTY_LIVE, active: false });
      setShowContentGap(false);
      setShowUnderstandingGap(false);

      initialThinkingTimeoutRef.current = setTimeout(() => {
        if (!initialThinkingHiddenRef.current) {
          initialThinkingHiddenRef.current = true;
          setShowInitialThinking(false);
        }
      }, 33000);

      try {
        const sessionId = currentSessionId
          ? await ensureSession(currentSessionId)
          : await ensureSession();

        setCurrentSessionId(sessionId);
        localStorage.setItem("active_session_id", sessionId);

        if (!currentSessionId && fetchSessions) {
          await fetchSessions("", true);
          setActiveIndex?.(0);
        }

        abortControllerRef.current = new AbortController();

        await sendMessage(
          sessionId,
          messageText,
          abortControllerRef.current.signal,
          {
            onContentToken: (token, streamType) => {
              if (
                streamType === "rewrite_token" ||
                streamType === "understanding_token"
              ) {
                understandingReceivedRef.current = true;

                if (!initialThinkingHiddenRef.current) {
                  initialThinkingHiddenRef.current = true;
                  setShowInitialThinking(false);

                  if (initialThinkingTimeoutRef.current) {
                    clearTimeout(initialThinkingTimeoutRef.current);
                    initialThinkingTimeoutRef.current = null;
                  }
                }

                understandingAccRef.current += token;
                setUnderstandingContent(understandingAccRef.current);
                return;
              }

              if (
                streamType === "understanding_done" ||
                streamType === "rewrite_done"
              ) {
                understandingDoneRef.current = true;
                setShowInitialThinking(false);
                setShowThinkingBetween(true);
                setShowUnderstandingGap(true);
                setTimeout(() => {
                  setShowUnderstanding(false);
                }, 500);
                return;
              }

              if (streamType === "content") {
                if (
                  !understandingReceivedRef.current &&
                  !initialThinkingHiddenRef.current
                ) {
                  initialThinkingHiddenRef.current = true;
                  setShowInitialThinking(false);

                  if (initialThinkingTimeoutRef.current) {
                    clearTimeout(initialThinkingTimeoutRef.current);
                    initialThinkingTimeoutRef.current = null;
                  }
                }

                hasContentStartedRef.current = true;
                setShowThinkingBetween(false);
                setWaitingForNextChunk(false);
                setShowUnderstandingGap(false);
                setShowContentGap(true);

                if (
                  !sidebarLoadedRef.current &&
                  !currentSessionId &&
                  fetchSessions
                ) {
                  sidebarLoadedRef.current = true;
                  setTimeout(() => {
                    fetchSessions("", true);
                    setActiveIndex?.(0);
                  }, 300);
                }
              }

              let cleanedToken = token;

              if (document.hidden) {
                accRef.current.content += cleanedToken;
                setLiveMessage((prev) => ({
                  ...prev,
                  active: true,
                  content: accRef.current.content,
                }));
              } else {
                tokenQueueRef.current.push({ type: 'content', text: cleanedToken });

                if (!typingIntervalRef.current) {
                  typingIntervalRef.current = setInterval(() => {
                    if (tokenQueueRef.current.length === 0) {
                      isTypingRef.current = false;
                      if (!hasContentStartedRef.current)
                        setWaitingForNextChunk(true);
                      return;
                    }

                    isTypingRef.current = true;
                    const nextToken = tokenQueueRef.current.shift();
                    if (nextToken.type === 'content') {
                      accRef.current.content += nextToken.text;
                    } else if (nextToken.type === 'company_content') {
                      accRef.current.company_content += nextToken.text;
                    }

                    setLiveMessage((prev) => ({
                      ...prev,
                      active: true,
                      content: accRef.current.content,
                      company_content: accRef.current.company_content,
                    }));
                  }, 60);
                }
              }
            },

            onSuggestions: (suggestions) => {
              accRef.current.suggestions = suggestions;
              setLiveMessage((prev) => ({ ...prev, suggestions }));
            },

            onMedia: (rawMedia) => {
              accRef.current.media = {
                videos: (rawMedia.videos || []).map(normalizeVideo),
                images: (rawMedia.images || []).map(normalizeImage),
                pdfs: (rawMedia.pdfs || []).map(normalizePdf),
              };

              console.log("AFTER NORMALIZE", accRef.current.media.images);

              setLiveMessage((prev) => ({
                ...prev,
                media: accRef.current.media,
              }));
            },

            onTopic: (topicData) => {
              const { code, name } =
                typeof topicData === "string"
                  ? { code: topicData, name: topicData }
                  : topicData;

              if (code && code.trim() && name && name.trim()) {
                // If we have pending topics, flush them to the queue
                if (accRef.current.pendingTopics.length > 0) {
                  accRef.current.pendingTopics.forEach((t) => {
                    const idx = accRef.current.topics.indexOf(t);
                    if (idx !== -1) {
                      // Push to queue so it stays in sequence with words
                      tokenQueueRef.current.push({
                        type: 'content',
                        text: ` @@SOURCE_REF_${idx + 1}@@\n\n`,
                      });
                    }
                  });
                  accRef.current.pendingTopics = [];
                }

                if (!accRef.current.topics.includes(code)) {
                  accRef.current.topics.push(code);
                }

                // Add to current pending block
                if (!accRef.current.pendingTopics.includes(code)) {
                  accRef.current.pendingTopics.push(code);
                }

                setLiveMessage((prev) => ({
                  ...prev,
                  topics: [...accRef.current.topics],
                }));
              }
            },

            onCheckLicCourses: (data) => {
              accRef.current.checkLicCoursesData = data;
              setLiveMessage((prev) => ({
                ...prev,
                checkLicCoursesData: data,
              }));
            },

            onCompanyContent: (contentChunk) => {
              if (document.hidden) {
                accRef.current.company_content += contentChunk;
                setLiveMessage((prev) => ({
                  ...prev,
                  company_content: accRef.current.company_content,
                }));
              } else {
                tokenQueueRef.current.push({ type: 'company_content', text: contentChunk });
                if (!typingIntervalRef.current) {
                  typingIntervalRef.current = setInterval(() => {
                    if (tokenQueueRef.current.length === 0) {
                      isTypingRef.current = false;
                      if (!hasContentStartedRef.current)
                        setWaitingForNextChunk(true);
                      return;
                    }

                    isTypingRef.current = true;
                    const nextToken = tokenQueueRef.current.shift();
                    if (nextToken.type === 'content') {
                      accRef.current.content += nextToken.text;
                    } else if (nextToken.type === 'company_content') {
                      accRef.current.company_content += nextToken.text;
                    }

                    setLiveMessage((prev) => ({
                      ...prev,
                      active: true,
                      content: accRef.current.content,
                      company_content: accRef.current.company_content,
                    }));
                  }, 80);
                }
              }
            },

            onTranscriptResult: (chunks) => {
              accRef.current.transcripts = chunks;
              setLiveMessage((prev) => ({
                ...prev,
                transcripts: accRef.current.transcripts,
              }));
            },

            onError: (errMsg) => {
              console.error("SSE error:", errMsg);

              if (initialThinkingTimeoutRef.current) {
                clearTimeout(initialThinkingTimeoutRef.current);
                initialThinkingTimeoutRef.current = null;
              }
              if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
                typingIntervalRef.current = null;
              }

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
              resetStreamingUI();
            },

            onDone: async () => {
              if (initialThinkingTimeoutRef.current) {
                clearTimeout(initialThinkingTimeoutRef.current);
                initialThinkingTimeoutRef.current = null;
              }

              // Flush remaining pending topics before waiting for the queue
              if (accRef.current.pendingTopics.length > 0) {
                accRef.current.pendingTopics.forEach((t) => {
                  const idx = accRef.current.topics.indexOf(t);
                  if (idx !== -1) {
                    tokenQueueRef.current.push({
                      type: 'content',
                      text: ` @@SOURCE_REF_${idx + 1}@@\n\n`,
                    });
                  }
                });
                accRef.current.pendingTopics = [];
              }

              setShowInitialThinking(false);
              setShowThinkingBetween(false);
              setShowUnderstandingGap(false);

              if (!understandingReceivedRef.current) {
                setShowUnderstanding(false);
              }

              await new Promise((resolve) => {
                const drainAndResolve = () => {
                  while (tokenQueueRef.current.length > 0) {
                    const nextToken = tokenQueueRef.current.shift();
                    if (nextToken.type === 'content') {
                      accRef.current.content += nextToken.text;
                    } else if (nextToken.type === 'company_content') {
                      accRef.current.company_content += nextToken.text;
                    }
                  }
                  setLiveMessage((prev) => ({
                    ...prev,
                    active: true,
                    content: accRef.current.content,
                    company_content: accRef.current.company_content,
                  }));
                  if (typingIntervalRef.current) {
                    clearInterval(typingIntervalRef.current);
                    typingIntervalRef.current = null;
                  }
                  resolve();
                };

                if (document.hidden) {
                  drainAndResolve();
                  return;
                }

                const checkQueue = setInterval(() => {
                  if (document.hidden) {
                    clearInterval(checkQueue);
                    drainAndResolve();
                    return;
                  }

                  if (tokenQueueRef.current.length === 0) {
                    clearInterval(checkQueue);
                    if (typingIntervalRef.current) {
                      clearInterval(typingIntervalRef.current);
                      typingIntervalRef.current = null;
                    }
                    resolve();
                  }
                }, 50);
              });

              if (!alreadyCommittedRef.current) {
                const acc = accRef.current;

                setmessages((prev) => [
                  ...prev,
                  {
                    role: "assistant",
                    content: acc.content,
                    company_content: acc.company_content,
                    videos: acc.media.videos,
                    images: acc.media.images,
                    pdfs: acc.media.pdfs,
                    topics: acc.topics,
                    transcripts: acc.transcripts,
                    question_suggestions: acc.suggestions || [],
                    checkLicCoursesData: acc.checkLicCoursesData,
                    timestamp: new Date().toISOString(),
                    mediaLoaded: true,
                  },
                ]);
              }

              accRef.current = EMPTY_ACC();
              understandingAccRef.current = "";
              understandingReceivedRef.current = false;
              resetStreamingUI();
              fetchSessions?.("", true);
            },
          },
        );
      } catch (err) {
        if (err.name === "AbortError" || err.name === "CanceledError") return;

        console.error("handleSend error:", err);

        if (initialThinkingTimeoutRef.current) {
          clearTimeout(initialThinkingTimeoutRef.current);
          initialThinkingTimeoutRef.current = null;
        }
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }

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
        resetStreamingUI();
      }
    },
    [
      isStreaming,
      searchQuery,
      currentSessionId,
      setmessages,
      setCurrentSessionId,
      setDisableNewChat,
      fetchSessions,
      setActiveIndex,
      resetStreamingUI,
    ],
  );

  // ── Save chat ───
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
        await fetchSessions?.();
        const savedRes = await getSavedSessions();
        const savedIds = new Set(
          (savedRes.saved_sessions || []).map((s) => s.session_id),
        );
        fetchSessions?.(undefined, (prev) =>
          prev.map((s) => ({ ...s, is_saved: savedIds.has(s.session_id) })),
        );
      }
    } catch {
      setSaveDialog({
        open: true,
        message: "Failed to save chat",
        isError: true,
      });
    }
  };

  // ── Sub-components ──
  const InitialThinkingBubble = () => (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        width: "fit-content",
        animation: "fadeIn 0.25s ease-in",
        "@keyframes fadeIn": {
          from: { opacity: 0, transform: "translateY(6px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          backgroundColor: "primary.main",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          component="img"
          src={DolphinIconW}
          alt="Dolphin"
          sx={{
            width: 24,
            height: 24,
            animation: "swimBubble 2s ease-in-out infinite",
            "@keyframes swimBubble": {
              "0%": { transform: "translateY(0px) rotate(0deg)" },
              "25%": { transform: "translateY(-3px) rotate(-10deg)" },
              "50%": { transform: "translateY(0px) rotate(0deg)" },
              "75%": { transform: "translateY(3px) rotate(10deg)" },
              "100%": { transform: "translateY(0px) rotate(0deg)" },
            }
          }}
        />
      </Box>
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderRadius: 3,
          backgroundColor: "background.chatbackground",
          color: "primary.main",
          fontWeight: 500,
          fontSize: 14,
        }}
      >
        Dolphin is thinking
        <Box
          component="span"
          sx={{
            display: "inline-flex",
            ml: 0.5,
            "& span": { animation: "blink 1.4s infinite both" },
            "& span:nth-of-type(2)": { animationDelay: "0.2s" },
            "& span:nth-of-type(3)": { animationDelay: "0.4s" },
            "@keyframes blink": {
              "0%": { opacity: 0.2 },
              "20%": { opacity: 1 },
              "100%": { opacity: 0.2 },
            },
          }}
        >
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </Box>
      </Box>
    </Box>
  );

  const showWelcome =
    !loading &&
    !liveMessage.active &&
    !showUnderstanding &&
    !showInitialThinking &&
    !showThinkingBetween &&
    (messages?.length === 0 || !messages) &&
    activeIndex === null &&
    !currentSessionId;

  // ── Render ──
  return (
    <Box
      sx={{
        width: { xs: "100vw", md: getContentWidth(fontLevel) },
        backgroundColor: "background.light1",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          px: { xs: 1.5, sm: 4, md: 7 },
          py: { xs: 1, md: 2 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            width: { xs: "50%", md: "80%" },
          }}
        >
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
      </Box>

      {/* Message list */}
      {showWelcome ? (
        <WelcomeChatScreen
          handleSend={handleSend}
          setSearchQuery={setSearchQuery}
        />
      ) : loading ? (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 2 }}>
          <Box
            component="img"
            src={mode === "dark" ? DolphinIconW : DolphinIconB}
            alt="Loading..."
            sx={{
              width: 80,
              height: 80,
              animation: "swimCenter 2s ease-in-out infinite",
              "@keyframes swimCenter": {
                "0%": { transform: "translateY(0px) rotate(0deg)" },
                "25%": { transform: "translateY(-15px) rotate(-10deg)" },
                "50%": { transform: "translateY(0px) rotate(0deg)" },
                "75%": { transform: "translateY(15px) rotate(10deg)" },
                "100%": { transform: "translateY(0px) rotate(0deg)" },
              }
            }}
          />
          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              fontWeight: 600,
              animation: "pulseText 2s infinite ease-in-out",
              "@keyframes pulseText": {
                "0%, 100%": { opacity: 0.5 },
                "50%": { opacity: 1 }
              }
            }}
          >
            Loading your chats...
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
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
              pt: 2,
              pb: 4,
              px: { xs: 1, md: 5 },
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            {/* Committed messages */}
            {messages?.map((msg, index) => (
              <ChatMessage
                key={index}
                handleSend={handleSend}
                setSearchQuery={setSearchQuery}
                sessionId={currentSessionId}
                msg={msg}
                messageIndex={index}
                videos_suggestions={msg?.videos || msg?.video_suggestions || []}
                images_suggestions={msg?.images || msg?.metadata?.images || []}
                pdf_suggestions={msg?.pdfs || msg?.metadata?.pdfs || []}
                onFeedbackSubmit={handleFeedbackSubmit}
                onTopicClick={(topicCode) =>
                  handleTopicClick(topicCode, msg.topics)
                }
                isStreaming={false}
              />
            ))}

            {/* Initial thinking bubble */}
            {showInitialThinking && !understandingContent && (
              <InitialThinkingBubble />
            )}

            {/* Understanding / rewrite stream */}
            {showUnderstanding &&
              understandingContent &&
              understandingReceivedRef.current && (
                <>
                  <ChatMessage
                    key="understanding"
                    handleSend={handleSend}
                    setSearchQuery={setSearchQuery}
                    sessionId={currentSessionId}
                    msg={{
                      role: "assistant",
                      content: understandingContent,
                      mediaLoaded: true,
                      timestamp: new Date().toISOString(),
                      question_suggestions: [],
                    }}
                    videos_suggestions={[]}
                    images_suggestions={[]}
                    pdf_suggestions={[]}
                    isStreaming={false}
                    skipMarkdownFormatting={true}
                    plainText={true}
                  />

                  {showUnderstandingGap && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        py: 0.5,
                        animation: "fadeIn 0.3s ease-in",
                        "@keyframes fadeIn": {
                          from: { opacity: 0, transform: "translateY(-6px)" },
                          to: { opacity: 1, transform: "translateY(0)" },
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 60,
                          height: 2,
                          backgroundColor: "divider",
                          borderRadius: 1,
                        }}
                      />
                    </Box>
                  )}
                </>
              )}

            {/* Live answer */}
            {(liveMessage.active ||
              (showThinkingBetween &&
                !showInitialThinking &&
                !showUnderstanding)) && (
                <ChatMessage
                  key="live-answer"
                  handleSend={handleSend}
                  setSearchQuery={setSearchQuery}
                  sessionId={currentSessionId}
                  msg={{
                    role: "assistant",
                    content: `${liveMessage.content || ""}${waitingForNextChunk ? "\n\nDolphin is thinking..." : ""}`,
                    company_content: liveMessage.company_content,
                    mediaLoaded: false,
                    timestamp: new Date().toISOString(),
                    question_suggestions: [],
                    topics: liveMessage.topics,
                    transcripts: liveMessage.transcripts,
                  }}
                  videos_suggestions={liveMessage.media.videos || []}
                  images_suggestions={liveMessage.media.images || []}
                  pdf_suggestions={liveMessage.media.pdfs || []}
                  onTopicClick={(topicCode) =>
                    handleTopicClick(topicCode, liveMessage.topics)
                  }
                  isStreaming={true}
                />
              )}

            <div ref={bottomRef} />
          </Box>

          {/* Sources side panel - Matching Screenshot Design */}
          {sourcesData.open && (
            <Box
              sx={{
                width: { xs: "100%", md: "350px" },
                borderLeft: "1px solid",
                borderColor: "divider",
                backgroundColor: mode === "dark" ? "background.paper" : "#f5faff", // Light blue/gray background from screenshot
                display: "flex",
                flexDirection: "column",
                position: { xs: "fixed", md: "relative" },
                top: 0,
                right: 0,
                bottom: 0,
                zIndex: 1000,
                height: "100%",
                animation: "slideIn 0.3s ease-out",
                "@keyframes slideIn": {
                  from: { transform: "translateX(100%)" },
                  to: { transform: "translateX(0)" },
                },
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  p: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid rgba(0,0,0,0.05)",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: "primary.main",
                    fontSize: "1.1rem",
                  }}
                >
                  {sourcesData.totalSources || sourcesData.topics.length} Sources
                </Typography>
                <IconButton
                  onClick={() => setSourcesData((p) => ({ ...p, open: false }))}
                  sx={{ color: "text.secondary" }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>

              <Box
                sx={{
                  p: 2,
                  flex: 1,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  "&::-webkit-scrollbar": { width: "6px" },
                  "&::-webkit-scrollbar-track": { background: "transparent" },
                  "&::-webkit-scrollbar-thumb": {
                    background: "rgba(0,0,0,0.1)",
                    borderRadius: "10px",
                  },
                }}
              >
                {sourcesData.loading ? (
                  <Box sx={{ py: 4, textAlign: "center" }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : sourcesData.detailTopic ? (
                  // Detail View
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <Button
                      startIcon={
                        <KeyboardArrowUpIcon
                          style={{ transform: "rotate(-90deg)" }}
                        />
                      }
                      onClick={() =>
                        setSourcesData((p) => ({ ...p, detailTopic: null }))
                      }
                      sx={{
                        alignSelf: "flex-start",
                        textTransform: "none",
                        color: "primary.main",
                        fontWeight: 600,
                      }}
                    >
                      Back to Sources
                    </Button>

                    <Box
                      sx={{
                        backgroundColor: mode === "dark" ? "background.default" : "#fff",
                        borderRadius: "12px",
                        overflow: "hidden",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                        border: "1px solid",
                        borderColor: mode === "dark" ? "divider" : "rgba(0,0,0,0.05)",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <Box sx={{ p: 2 }}>
                        <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
                          <Box
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              backgroundColor: "primary.main",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.85rem",
                              fontWeight: 700,
                            }}
                          >
                            {sourcesData.detailTopic.index}
                          </Box>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 800,
                              color: "text.primary",
                              lineHeight: 1.2,
                            }}
                          >
                            {sourcesData.detailTopic.topicName}
                          </Typography>
                        </Box>

                        <Box
                          className="chat-markdown"
                          sx={{
                            ...markdownContainerSx,
                            fontSize: "0.85rem",
                            lineHeight: 1.6,
                            color: "text.primary",
                          }}
                          dangerouslySetInnerHTML={{
                            __html: sanitizeMarkdown(
                              sourcesData.detailTopic.content,
                            ),
                          }}
                        />
                      </Box>

                      {sourcesData.detailTopic.courseName && (
                        <Box
                          sx={{
                            py: 1.5,
                            px: 2,
                            backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "#eef6ff",
                            borderTop: "1px solid",
                            borderColor: mode === "dark" ? "divider" : "rgba(0,0,0,0.03)",
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: "primary.main",
                              fontWeight: 700,
                              fontSize: "0.75rem",
                            }}
                          >
                            Course: {sourcesData.detailTopic.courseName}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                ) : (
                  // List View
                  sourcesData.topics.map((topic, i) => (
                    <Box
                      key={topic.code}
                      sx={{
                        backgroundColor: mode === "dark" ? "background.default" : "#fff",
                        borderRadius: "12px",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                        border: sourcesData.selectedTopicCode === topic.code ? "2px solid" : "1px solid",
                        borderColor: sourcesData.selectedTopicCode === topic.code
                          ? "primary.main"
                          : mode === "dark"
                            ? "divider"
                            : "rgba(0,0,0,0.07)",
                        display: "flex",
                        flexDirection: "column",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {/* Title row */}
                      <Box
                        sx={{
                          px: 2,
                          pt: 2,
                          pb: 0.5,
                          display: "flex",
                          gap: 1.5,
                          alignItems: "flex-start",
                        }}
                      >
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            minWidth: 24,
                            borderRadius: "50%",
                            backgroundColor: "primary.main",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            mt: "2px",
                          }}
                        >
                          {topic.index}
                        </Box>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 800,
                            color: "text.primary",
                            lineHeight: 1.25,
                            fontSize: "0.95rem",
                          }}
                        >
                          {topic.topicName}
                        </Typography>
                      </Box>

                      {/* Preview text — clamped */}
                      <Box sx={{ px: 2, pt: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "text.secondary",
                            fontSize: "0.85rem",
                            lineHeight: 1.5,
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {topic.content.replace(/[#*`]/g, "")}
                        </Typography>
                      </Box>

                      {/* Read More — always fully visible */}
                      <Box sx={{ px: 2, pt: 0.5, pb: 1.5 }}>
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{
                            color: "primary.main",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            "&:hover": { textDecoration: "underline" },
                          }}
                          onClick={() =>
                            setSourcesData((p) => ({
                              ...p,
                              detailTopic: topic,
                            }))
                          }
                        >
                          Read More...
                        </Typography>
                      </Box>

                      {/* Course footer */}
                      {topic.courseName && (
                        <Box
                          sx={{
                            py: 1,
                            px: 2,
                            backgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "#eef6ff",
                            borderTop: "1px solid",
                            borderColor: mode === "dark" ? "divider" : "rgba(0,0,0,0.06)",
                            borderRadius: "0 0 12px 12px",
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: "primary.main",
                              fontWeight: 600,
                              fontSize: "0.7rem",
                              display: "block",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            Course: {topic.courseName}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Input bar */}
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
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "primary.main",
                borderRadius: 2,
              },
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
              if (isStreaming) return; // prevent sending while streaming
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <Box
            sx={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
            }}
          >
            <Message
              size={22}
              color={mode === "dark" ? "#1cb0f6" : "#106BA3"}
            />
          </Box>

          <IconButton
            onClick={() => handleSend()}
            disabled={isStreaming}
            sx={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              height: 36,
              width: 36,
              borderRadius: 2,
              opacity: isStreaming ? 0.4 : 1,
            }}
          >
            <SendIcon
              size={20}
              color={mode === "dark" ? "#1989D0" : "#106BA3"}
            />
          </IconButton>
        </Box>

        <Typography
          variant="caption"
          sx={{
            fontWeight: 500,
            textAlign: "center",
            p: 1,
            color: "text.caption",
          }}
        >
          This AI-generated content is for educational purposes only and may not
          reflect the most current regulations or company policies. Always
          verify with official sources and your organization's safety management
          system (SMS) before applying in practice.
        </Typography>
      </Box>

      {/* Save dialog */}
      <Dialog
        open={saveDialog.open}
        onClose={() => setSaveDialog({ ...saveDialog, open: false })}
        maxWidth="xs"
        fullWidth
        BackdropProps={{
          sx: {
            backdropFilter: "blur(6px)",
            backgroundColor: "rgba(0,0,0,0.2)",
          },
        }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            backdropFilter: "blur(10px)",
            background: "rgba(255,255,255,0.8)",
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
          {saveDialog.isError ? (
            <ErrorIcon sx={{ fontSize: 50, color: "error.main", mb: 1 }} />
          ) : (
            <CheckCircleIcon sx={{ fontSize: 50, color: "#1cb0f6", mb: 1 }} />
          )}
          <Typography
            variant="body1"
            sx={{ mt: 1, fontWeight: 500, color: "text.primary" }}
          >
            {saveDialog.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <Button
            onClick={() => setSaveDialog({ ...saveDialog, open: false })}
            variant="contained"
            sx={{
              width: 100,
              height: 40,
              borderRadius: 1,
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
