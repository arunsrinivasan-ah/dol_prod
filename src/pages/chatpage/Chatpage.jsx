import { useMediaQuery, useTheme } from "@mui/material";
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import ChatSideBar from "../../components/chat/ChatSideBar";
import ChatWindow from "../../components/chat/ChatWindow";
import { fetchHealth } from "../../api/fetchApi";
import axios from "axios";
import Header from "../../components/header/Header";
import MainLayout from "../../layouts/MainLayout";

const APP_URL = process.env.REACT_APP_BASE_URL;

const Chatpage = ({ userId, setUserId, onLogout }) => {
  const [sessionData, setSessionData] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [currentSessionData, setCurrentSessionData] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionDetailsLoading, setSessionDetailsLoading] = useState(false);
  const [messages, setmessages] = useState([]);
  const [disableNewChat, setDisableNewChat] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const fetchInProgressRef = useRef(false);
  const initialLoadRef = useRef(false);

  const fetchSessions = useCallback(async (searchTerm = "", isBackground = false) => {
    if (fetchInProgressRef.current) return;

    try {
      fetchInProgressRef.current = true;
      if (!isBackground) setSessionsLoading(true);

      const userId = localStorage.getItem("user_id");

      const response = await axios.get(`${APP_URL}/sessions`, {
        params: {
          user_id: userId,
          ...(searchTerm && { search: searchTerm }),
        },
        withCredentials: true,
      });

      if (response.status === 200) {
        // Only update if data actually changed
        const newData = response.data;
        setSessionData(prevData => {
          if (JSON.stringify(prevData) === JSON.stringify(newData)) {
            return prevData;
          }
          return newData;
        });
      }
    } catch (error) {
      console.error("Unable to fetch sessions");
    } finally {
      if (!isBackground) setSessionsLoading(false);
      fetchInProgressRef.current = false;
    }
  }, []);

  const selectSession = useCallback(async (sessionId) => {
    if (!sessionId) return;

    try {
      setSessionDetailsLoading(true);

      const userId = localStorage.getItem("user_id");

      const response = await axios.get(`${APP_URL}/sessions/${sessionId}`, {
        params: { user_id: userId },
        withCredentials: true,
      });

      const data = response.data;

      setCurrentSessionId(data.session_id);
      setCurrentSessionData(data);
      setmessages(data.messages || []);

      // Persist session ID for refresh
      localStorage.setItem("active_session_id", data.session_id);
    } catch (error) {
      console.error("Unable to load session");
    } finally {
      setSessionDetailsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    const loadHealth = async () => {
      const health = await fetchHealth();
      if (health) {
        await fetchSessions();

        // Auto-load last active session
        const lastSessionId = localStorage.getItem("active_session_id");
        if (lastSessionId) {
          await selectSession(lastSessionId);
        }
      } else {
        setUserId(null);
      }
      setIsInitializing(false);
    };

    loadHealth();
  }, [fetchSessions, setUserId, selectSession]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTab = useMediaQuery(theme.breakpoints.down("md"));

  // Memoize sidebar props with stable references
  const sidebarProps = useMemo(() => ({
    sessionData,
    loading: sessionsLoading,
    activeIndex,
    setActiveIndex,
    selectSession,
    sidebarOpen,
    setSidebarOpen,
    fetchSessions,
    currentSessionId,
  }), [sessionData, sessionsLoading, activeIndex, selectSession, sidebarOpen, fetchSessions, currentSessionId]);

  // Memoize chat window props
  const chatWindowProps = useMemo(() => ({
    currentSessionData,
    currentSessionId,
    setCurrentSessionId,
    activeIndex,
    loading: sessionDetailsLoading || isInitializing,
    fetchSessions,
    messages,
    setmessages,
    setDisableNewChat,
    setActiveIndex,
    selectSession,
  }), [currentSessionData, currentSessionId, activeIndex, sessionDetailsLoading, isInitializing, fetchSessions, messages, setmessages, setActiveIndex, selectSession]);

  return (
    <MainLayout
      header={
        <Header
          onLogout={onLogout}
          setSessionData={setSessionData}
          setCurrentSessionData={setCurrentSessionData}
          setActiveIndex={setActiveIndex}
          setCurrentSessionId={setCurrentSessionId}
          setmessages={setmessages}
          disableNewChat={disableNewChat}
          sessionData={sessionData}
          loading={sessionsLoading}
          activeIndex={activeIndex}
          selectSession={selectSession}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          fetchSessions={fetchSessions}
        />
      }
      leftPanel={<ChatSideBar {...sidebarProps} />}
      contentPanel={<ChatWindow {...chatWindowProps} />}
    />
  );
};

export default Chatpage;