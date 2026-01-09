import axios from "axios";

export const fetchHealth = async () => {
  try {
    const resp = await axios.get("/api/v1/health", {
      withCredentials: true,
    });

    if (resp.ok) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    if (error.response) {
      return;
    }
    throw new Error(error.message || "Network error");
  }
};
export const createSession = async () => {
  try {
    const response = await axios.post(
      "/sessions",
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    const data = response.data;

    // this.currentSessionId = data.session_id;
    // this.sessionCache = [data, ...this.sessionCache];
    // this.renderSessions(this.sessionCache, this.currentSessionId);
    // this.chatWindow.innerHTML = "";
    // this.clearSuggestions();
    // this.showWelcomeCard();

    return data;
  } catch (error) {
    throw new Error("Unable to create a new session");
  }
};
export const ensureSession = async (currentSessionId) => {
  if (currentSessionId) return currentSessionId;
  const session = await createSession();
  return session.session_id;
};

export const sendMessage = async (sessionId, messageText) => {
  // removeWelcomeCard();
  // lastUserPrompt = messageText;

  // const sessionId = await ensureSession();
  // createMessage('user', messageText, new Date().toLocaleTimeString());
  // toggleLoading(true);

  try {
    const response = await axios.post(
      "/chat",
      {
        content: messageText,
        session_id: sessionId,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true, // equivalent to credentials: 'include'
      }
    );
    // console.log("wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww chat response", response);

    const data = response.data;
    const nodeResponse = data.node_response || data;

    const botMessage = nodeResponse.content || "I did not receive a response.";
    const botTimestamp = new Date(
      nodeResponse.timestamp || Date.now()
    ).toLocaleTimeString();

    const videos =
      nodeResponse.videos ||
      nodeResponse.video_suggestions ||
      nodeResponse.metadata?.videos ||
      [];

    const images = nodeResponse.images || nodeResponse.metadata?.images || [];

    const pdfs = nodeResponse.pdfs || nodeResponse.metadata?.pdfs || [];

    console.debug("[Chat] Response received", {
      hasNodeResponse: Boolean(data.node_response),
      videoSuggestions: nodeResponse.video_suggestions,
      videos,
      images,
      pdfs,
      questionSuggestions: nodeResponse.question_suggestions,
      rawResponse: data,
    });

    // if (quizPayload) {
    //   lastQuizPrompt = lastUserPrompt;
    //   renderQuizMessage(quizPayload);
    // } else {
    //   createMessage('assistant', botMessage, botTimestamp);
    // }

    // renderVideoSuggestions(videos);
    // renderImageSuggestions(images);
    // renderPdfSuggestions(pdfs);
    // renderQuestionSuggestions(
    //   nodeResponse.question_suggestions || []
    // );

    // Safely refresh sessions
    // try {
    //   await fetchSessions(sessionSearchInput.value.trim());
    // } catch (e) {
    //   console.warn('Session refresh failed but continuing', e);
    // }
    return response.data;
  } catch (error) {
    console.error("[Chat] Failed to send message", error);

    // Axios-specific error handling
    const errMsg =
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      "Something went wrong. Please try again.";

    // createMessage('assistant', `⚠️ ${errMsg}`);
  } finally {
    // toggleLoading(false);
  }
};
