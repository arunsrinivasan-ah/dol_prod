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
        withCredentials: true,
      }
    );
    

    const data = response.data;

     try {
      const response = await axios.get("/sessions", {
        params:  {},
        withCredentials: true,
      });

    } catch (error) {
      console.error("Unable to fetch sessions");
    }
    // const nodeResponse = data.node_response || data;

    // const botMessage = nodeResponse.content || "I did not receive a response.";
    // const botTimestamp = new Date(
    //   nodeResponse.timestamp || Date.now()
    // ).toLocaleTimeString();

    // const videos =
    //   nodeResponse.videos ||
    //   nodeResponse.video_suggestions ||
    //   nodeResponse.metadata?.videos ||
    //   [];

    // const images = nodeResponse.images || nodeResponse.metadata?.images || [];

    // const pdfs = nodeResponse.pdfs || nodeResponse.metadata?.pdfs || [];

   
    return response.data;
  } catch (error) {
    console.error("[Chat] Failed to send message", error);

    const errMsg =
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      "Something went wrong. Please try again.";

  } finally {

  }
};

