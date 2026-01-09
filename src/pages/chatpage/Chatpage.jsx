import { Grid } from "@mui/material";
import React, { useEffect, useState } from "react";
import ChatSideBar from "../../components/chat/ChatSideBar";
import ChatWindow from "../../components/chat/ChatWindow";
import { fetchHealth } from "../../api/fetchApi";
import axios from "axios";
import Header from "../../components/header/Header";

const Chatpage = ({ userId, setUserId }) => {
  const [sessionData, setSessionData] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);

  const [currentSessionData, setCurrentSessionData] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionDetailsLoading, setSessionDetailsLoading] = useState(false);

  const fetchSessions = async (searchTerm = "") => {
    try {
      setSessionsLoading(true);
      const response = await axios.get("/sessions", {
        params: searchTerm ? { search: searchTerm } : {},
        withCredentials: true,
      });

      if (response.status === 200) {
        setSessionData(response.data);
      }
    } catch (error) {
      console.error("Unable to fetch sessions");
    } finally {
      setSessionsLoading(false);
    }
  };

  const selectSession = async (sessionId) => {
    try {
      setSessionDetailsLoading(true);

      const response = await axios.get(`/sessions/${sessionId}`, {
        withCredentials: true,
      });

      const data = response.data;

      setCurrentSessionId(data.session_id);
      setCurrentSessionData(data);
    } catch (error) {
      console.error("Unable to load session");
    } finally {
      setSessionDetailsLoading(false);
    }
  };

  useEffect(() => {
    const health = fetchHealth();
    if (health) {
      fetchSessions();
    } else {
      setUserId(null);
    }
  }, []);

  return (
    <Grid container height="100vh" width="100vw" flexDirection="column">
      <Grid item xs={12} sx={{ height: "10vh" }} >
        <Header/>
      </Grid>

      <Grid item xs={12} sx={{ height: "90vh", display: "flex" }}>
        <ChatSideBar
          sessionData={sessionData}
          loading={sessionsLoading}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          selectSession={selectSession}
        />

        <ChatWindow
          currentSessionData={currentSessionData}
          currentSessionId={currentSessionId}
          setCurrentSessionId={setCurrentSessionId}
          activeIndex={activeIndex}
          loading={sessionDetailsLoading}
          fetchSessions={fetchSessions}
        />
      </Grid>
    </Grid>
  );
};

export default Chatpage;
