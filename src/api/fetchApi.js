// // fetchApi.js - Updated sendMessage function
// import axios from "axios";

// const APP_URL = process.env.REACT_APP_BASE_URL;

// export const fetchHealth = async () => {
//   try {
//     const resp = await axios.get(`${APP_URL}/api/v1/health`, {
//       withCredentials: true,
//     });
//     if (resp.ok) {
//       return true;
//     } else {
//       return false;
//     }
//   } catch (error) {
//     if (error.response) {
//       return;
//     }
//     throw new Error(error.message || "Network error");
//   }
// };

// export const createSession = async () => {
//   try {
//     const userId = localStorage.getItem("user_id");
//     const response = await axios.post(
//       `${APP_URL}/sessions`,
//       {
//         user_id: userId,
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//         },
//         withCredentials: true,
//       }
//     );
//     const data = response.data;
//     return data;
//   } catch (error) {
//     throw new Error("Unable to create a new session");
//   }
// };

// export const ensureSession = async (currentSessionId) => {
//   if (currentSessionId) return currentSessionId;
//   const session = await createSession();
//   return session.session_id;
// };

// // Main sendMessage function with proper SSE/stream handling
// export const sendMessage = async (sessionId, messageText, signal, callbacks) => {
//   const { onContentToken, onSuggestions, onMedia, onError, onDone } = callbacks;

//   try {
//     const userId = localStorage.getItem("user_id");

//     const response = await fetch(`${APP_URL}/chat`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         content: messageText,
//         session_id: sessionId,
//         user_id: userId,
//       }),
//       credentials: 'include',
//       signal: signal,
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const reader = response.body.getReader();
//     const decoder = new TextDecoder();
//     let buffer = '';

//     while (true) {
//       const { done, value } = await reader.read();
//       if (done) break;

//       buffer += decoder.decode(value, { stream: true });
//       const lines = buffer.split('\n');
//       buffer = lines.pop() || '';

//       for (const line of lines) {
//         if (line.startsWith('data: ')) {
//           const data = line.slice(6);

//           if (data === '[DONE]') {
//             onDone();
//             return;
//           }

//           try {
//             const parsed = JSON.parse(data);

//             // Handle different response types
//             if (parsed.type === 'content' || parsed.content) {
//               // Handle streaming content
//               const contentToAdd = parsed.content || parsed.data || '';
//               if (contentToAdd && onContentToken) {
//                 onContentToken(contentToAdd);
//               }
//             }

//             // Handle complete response with all data
//             if (parsed.videos || parsed.images || parsed.pdfs || parsed.question_suggestions) {
//               // This is a complete response with media
//               if (parsed.content && onContentToken) {
//                 onContentToken(parsed.content);
//               }
//               if (parsed.videos && onMedia) {
//                 onMedia({ videos: parsed.videos, images: parsed.images || [], pdfs: parsed.pdfs || [] });
//               }
//               if (parsed.question_suggestions && onSuggestions) {
//                 onSuggestions(parsed.question_suggestions);
//               }
//             }

//             // Handle partial media updates
//             if (parsed.video_suggestions && onMedia) {
//               onMedia({ 
//                 videos: parsed.video_suggestions, 
//                 images: parsed.images || [], 
//                 pdfs: parsed.pdfs || [] 
//               });
//             }

//           } catch (e) {
//             console.error('Failed to parse SSE data:', e, data);
//           }
//         }
//       }
//     }

//     onDone();

//   } catch (error) {
//     if (error.name === 'AbortError') {
//       throw error;
//     }
//     console.error("[Chat] Failed to send message", error);
//     const errMsg = error.response?.data?.message || error.message || "Something went wrong. Please try again.";
//     if (onError) onError(errMsg);
//     throw new Error(errMsg);
//   }
// };

// // Fetch sessions
// export const fetchSessions = async () => {
//   try {
//     const userId = localStorage.getItem("user_id");
//     const response = await axios.get(`${APP_URL}/sessions`, {
//       params: {
//         user_id: userId,
//       },
//       withCredentials: true,
//     });
//     return response.data;
//   } catch (error) {
//     console.error("Unable to fetch sessions", error);
//     throw error;
//   }
// };



// import axios from "axios";

// const APP_URL = process.env.REACT_APP_BASE_URL;

// export const fetchHealth = async () => {
//   try {
//     const resp = await axios.get(`${APP_URL}/api/v1/health`, {
//       withCredentials: true,
//     });
//     return resp.status === 200;
//   } catch (error) {
//     if (error.response) return false;
//     throw new Error(error.message || "Network error");
//   }
// };

// export const createSession = async () => {
//   try {
//     const userId = localStorage.getItem("user_id");
//     const response = await axios.post(
//       `${APP_URL}/sessions`,
//       { user_id: userId },
//       {
//         headers: { "Content-Type": "application/json" },
//         withCredentials: true,
//       }
//     );
//     return response.data;
//   } catch (error) {
//     throw new Error("Unable to create a new session");
//   }
// };

// export const ensureSession = async (currentSessionId) => {
//   if (currentSessionId) return currentSessionId;
//   const session = await createSession();
//   return session.session_id;
// };

// /**
//  * sendMessageStream — SSE streaming version
//  *
//  * @param {string}   sessionId
//  * @param {string}   messageText
//  * @param {AbortSignal} signal       — pass abortController.signal to cancel
//  * @param {object}   callbacks
//  * @param {(token: string) => void} callbacks.onRewriteToken
//  * @param {() => void}              callbacks.onRewriteDone
//  * @param {(token: string) => void} callbacks.onUnderstandingToken
//  * @param {() => void}              callbacks.onUnderstandingDone
//  * @param {(token: string) => void} callbacks.onContentToken
//  * @param {(suggestions: string[]) => void} callbacks.onSuggestions
//  * @param {(media: object) => void} callbacks.onMedia
//  * @param {(err: string) => void}   callbacks.onError
//  * @param {() => void}              callbacks.onDone
//  */
// export const sendMessage = async (
//   sessionId,
//   messageText,
//   signal,
//   {
//     onRewriteToken,
//     onRewriteDone,
//     onUnderstandingToken,
//     onUnderstandingDone,
//     onContentToken,
//     onSuggestions,
//     onMedia,
//     onError,
//     onDone,
//   } = {}
// ) => {
//   const userId = localStorage.getItem("user_id");

//   const response = await fetch(`${APP_URL}/chat`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     credentials: "include",
//     signal,
//     body: JSON.stringify({
//       content: messageText,
//       session_id: sessionId,
//       user_id: userId,
//     }),
//   });

//   if (!response.ok) {
//     const text = await response.text();
//     onError?.(text || `HTTP ${response.status}`);
//     return;
//   }

//   const reader = response.body.getReader();
//   const decoder = new TextDecoder("utf-8");
//   let buffer = "";

//   const processLine = (line) => {
//     // SSE lines look like: "data: {...}"
//     if (!line.startsWith("data:")) return;
//     const jsonStr = line.slice(5).trim();
//     if (!jsonStr) return;

//     let event;
//     try {
//       event = JSON.parse(jsonStr);
//     } catch {
//       return; // malformed chunk — skip
//     }

//     switch (event.type) {
//       case "rewrite_token":
//         onRewriteToken?.(event.token ?? "");
//         break;
//       case "rewrite_done":
//         onRewriteDone?.();
//         break;
//       case "understanding_token":
//         onUnderstandingToken?.(event.token ?? "");
//         break;
//       case "understanding_done":
//         onUnderstandingDone?.();
//         break;
//       case "content":
//         onContentToken?.(event.token ?? "");
//         break;
//       case "suggestions":
//         onSuggestions?.(event.question_suggestions ?? []);
//         break;
//       case "media":
//         onMedia?.({
//           videos: event.videos ?? [],
//           images: event.images ?? [],
//           pdfs: event.pdfs ?? [],
//         });
//         break;
//       case "error":
//         onError?.(event.message ?? "Unknown error");
//         break;
//       default:
//         break;
//     }
//   };

//   // Read the stream chunk by chunk
//   while (true) {
//     const { done, value } = await reader.read();
//     if (done) break;

//     buffer += decoder.decode(value, { stream: true });

//     // SSE events are separated by "\n\n"
//     const parts = buffer.split("\n\n");
//     buffer = parts.pop(); // keep the incomplete tail

//     for (const part of parts) {
//       // Each part may have multiple lines (e.g. "event:\ndata:\n")
//       for (const line of part.split("\n")) {
//         processLine(line.trim());
//       }
//     }
//   }

//   // Flush any remaining buffer
//   if (buffer.trim()) {
//     for (const line of buffer.split("\n")) {
//       processLine(line.trim());
//     }
//   }

//   onDone?.();
// };


// import axios from "axios";

// const APP_URL = process.env.REACT_APP_BASE_URL;

// // ─────────────────────────────────────────────────────────────
// // Health
// // ─────────────────────────────────────────────────────────────
// export const fetchHealth = async () => {
//   try {
//     const resp = await axios.get(`${APP_URL}/api/v1/health`, {
//       withCredentials: true,
//     });
//     return resp.status === 200;
//   } catch (error) {
//     if (error.response) return false;
//     throw new Error(error.message || "Network error");
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // Session
// // ─────────────────────────────────────────────────────────────
// export const createSession = async () => {
//   try {
//     const userId = localStorage.getItem("user_id");
//     const response = await axios.post(
//       `${APP_URL}/sessions`,
//       { user_id: userId },
//       {
//         headers: { "Content-Type": "application/json" },
//         withCredentials: true,
//       }
//     );
//     return response.data;
//   } catch (error) {
//     throw new Error("Unable to create a new session");
//   }
// };

// export const ensureSession = async (currentSessionId) => {
//   if (currentSessionId) return currentSessionId;
//   const session = await createSession();
//   return session.session_id;
// };

// // ─────────────────────────────────────────────────────────────
// // SSE Streaming Chat  — uses native fetch (NOT axios)
// //
// // Axios buffers the entire response before resolving.
// // fetch() + ReadableStream delivers chunks as they arrive.
// //
// // Backend emits:  data: {"type":"...", ...}\n\n
// //
// // Callbacks:
// //   onRewriteToken(token)
// //   onRewriteDone()
// //   onUnderstandingToken(token)
// //   onUnderstandingDone()
// //   onContentToken(token)
// //   onSuggestions(string[])
// //   onMedia({ videos, images, pdfs })
// //   onError(message)
// //   onDone()
// // ─────────────────────────────────────────────────────────────
// export const sendMessage = async (sessionId, messageText, onChunk, delayMs = 10) => {
//   try {
//     const response = await fetch(`${APP_URL}/chat`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "Accept": "text/event-stream",
//       },
//       body: JSON.stringify({
//         content: messageText,
//         session_id: sessionId,
//       }),
//       credentials: "include",
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const reader = response.body.getReader();
//     const decoder = new TextDecoder();
//     let buffer = "";

//     while (true) {
//       const { value, done } = await reader.read();
//       if (done) break;

//       buffer += decoder.decode(value, { stream: true });

//       const lines = buffer.split("\n");
//       buffer = lines.pop();

//       for (const line of lines) {
//         const trimmedLine = line.trim();
//         if (!trimmedLine) continue;

//         if (trimmedLine.startsWith("data: ")) {
//           try {
//             const jsonStr = trimmedLine.replace(/^data: /, "");
//             const chunk = JSON.parse(jsonStr);

//             if (onChunk) onChunk(chunk);

//             // Custom delays per chunk type
//             let delay = 0;
//             switch (chunk.type) {
//               case "content":
//                 delay = delayMs; // 10-15ms for character-by-character typing
//                 break;
//               case "metadata":
//                 delay = 0; // No delay for metadata
//                 break;
//               default:
//                 delay = 0;
//             }

//             if (delay > 0) {
//               await new Promise(resolve => setTimeout(resolve, delay));
//             }
//           } catch (e) {
//             console.warn("Failed to parse SSE chunk:", trimmedLine, e);
//           }
//         }
//       }
//     }
//   } catch (error) {
//     console.error("[Chat Stream] Failed to send message", error);
//     throw error;
//   }
// };


// import axios from "axios";

// const APP_URL = process.env.REACT_APP_BASE_URL;

// // ─────────────────────────────────────────────────────────────
// // Health
// // ─────────────────────────────────────────────────────────────
// export const fetchHealth = async () => {
//   try {
//     const resp = await axios.get(`${APP_URL}/api/v1/health`, {
//       withCredentials: true,
//     });
//     return resp.status === 200;
//   } catch (error) {
//     if (error.response) return false;
//     throw new Error(error.message || "Network error");
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // Session
// // ─────────────────────────────────────────────────────────────
// export const createSession = async () => {
//   try {
//     const userId = localStorage.getItem("user_id");
//     const response = await axios.post(
//       `${APP_URL}/sessions`,
//       { user_id: userId },
//       {
//         headers: { "Content-Type": "application/json" },
//         withCredentials: true,
//       }
//     );
//     return response.data;
//   } catch (error) {
//     throw new Error("Unable to create a new session");
//   }
// };

// export const ensureSession = async (currentSessionId) => {
//   if (currentSessionId) return currentSessionId;
//   const session = await createSession();
//   return session.session_id;
// };

// // ─────────────────────────────────────────────────────────────
// // sendMessage — chunk-by-chunk SSE stream
// //
// // HOW IT WORKS:
// //   fetch() opens the connection
// //   getReader() reads raw bytes as they arrive
// //   TextDecoder converts bytes → text
// //   buffer + split("\n") extracts every "data: {...}" line
// //   Each line is parsed → onChunk callback fires immediately
// //   UI re-renders after every single token
// //
// // NO axios (buffers full response)
// // NO flushSync (causes jank)
// // NO artificial delays
// // ─────────────────────────────────────────────────────────────
// export const sendMessage = async (
//   sessionId,
//   messageText,
//   signal,
//   callbacks = {}
// ) => {
//   const {
//     onRewriteToken,
//     onRewriteDone,
//     onUnderstandingToken,
//     onUnderstandingDone,
//     onContentToken,
//     onSuggestions,
//     onMedia,
//     onError,
//     onDone,
//   } = callbacks;

//   const userId = localStorage.getItem("user_id");

//   // ── Open SSE connection ───────────────────────────────────
//   let response;
//   try {
//     response = await fetch(`${APP_URL}/chat`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       credentials: "include",
//       signal,
//       body: JSON.stringify({
//         content: messageText,
//         session_id: sessionId,
//         user_id: userId,
//       }),
//     });
//   } catch (err) {
//     if (err.name === "AbortError") return;
//     onError?.(err.message || "Network error");
//     return;
//   }

//   if (!response.ok) {
//     const text = await response.text().catch(() => "");
//     onError?.(text || `HTTP ${response.status}`);
//     return;
//   }

//   // ── Stream reader setup ───────────────────────────────────
//   const reader  = response.body.getReader();
//   const decoder = new TextDecoder("utf-8");
//   let   buffer  = "";

//   // ── Route one parsed chunk to the right callback ──────────
//   const onChunk = (chunk) => {
//     switch (chunk.type) {
//       case "rewrite_token":
//         onRewriteToken?.(chunk.token ?? "");
//         break;
//       case "rewrite_done":
//         onRewriteDone?.();
//         break;
//       case "understanding_token":
//         onUnderstandingToken?.(chunk.token ?? "");
//         break;
//       case "understanding_done":
//         onUnderstandingDone?.();
//         break;
//       case "content":
//         onContentToken?.(chunk.token ?? "");
//         break;
//       case "suggestions":
//         onSuggestions?.(chunk.question_suggestions ?? []);
//         break;
//       case "media":
//         onMedia?.({
//           videos: chunk.videos ?? [],
//           images: chunk.images ?? [],
//           pdfs:   chunk.pdfs   ?? [],
//         });
//         break;
//       case "error":
//         onError?.(chunk.message ?? "Stream error");
//         break;
//       default:
//         break;
//     }
//   };

//   // ── Read loop ─────────────────────────────────────────────
//   // Each iteration = one raw TCP chunk from the server.
//   // We decode it, append to buffer, split on newlines,
//   // and process every complete "data: ..." line immediately.
//   // Incomplete lines stay in buffer until next chunk arrives.
//   try {
//     while (true) {
//       const { value, done } = await reader.read();
//       if (done) break;

//       // Decode this chunk's bytes to text (stream:true = handle
//       // multi-byte chars that span chunk boundaries)
//       buffer += decoder.decode(value, { stream: true });

//       // Split on newline — every complete SSE line is ready
//       const lines = buffer.split("\n");

//       // Last element may be incomplete — keep in buffer
//       buffer = lines.pop() ?? "";

//       for (const line of lines) {
//         const trimmed = line.trim();
//         if (!trimmed || !trimmed.startsWith("data:")) continue;

//         const jsonStr = trimmed.slice(5).trim(); // strip "data:"
//         if (!jsonStr || jsonStr === "[DONE]") continue;

//         try {
//           const chunk = JSON.parse(jsonStr);
//           onChunk(chunk); // 🔥 fires immediately, triggers React re-render
//         } catch {
//           // skip malformed line
//         }
//       }
//     }

//     // Flush any remaining bytes in decoder
//     buffer += decoder.decode();

//     // Process any final lines left in buffer
//     if (buffer.trim()) {
//       for (const line of buffer.split("\n")) {
//         const trimmed = line.trim();
//         if (!trimmed || !trimmed.startsWith("data:")) continue;
//         const jsonStr = trimmed.slice(5).trim();
//         if (!jsonStr || jsonStr === "[DONE]") continue;
//         try {
//           onChunk(JSON.parse(jsonStr));
//         } catch {
//           // skip
//         }
//       }
//     }

//     onDone?.();

//   } catch (err) {
//     if (err.name === "AbortError") return;
//     onError?.(err.message || "Stream read error");
//   }
// };


import axios from "axios";

const APP_URL = process.env.REACT_APP_BASE_URL;

export const fetchHealth = async () => {
  try {
    const resp = await axios.get(`${APP_URL}/api/v1/health`, {
      withCredentials: true,
    });
    return resp.status === 200;
  } catch (error) {
    if (error.response) return false;
    throw new Error(error.message || "Network error");
  }
};

export const createSession = async () => {
  try {
    const userId = localStorage.getItem("user_id");
    const response = await axios.post(
      `${APP_URL}/sessions`,
      { user_id: userId },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Unable to create a new session");
  }
};

export const ensureSession = async (currentSessionId) => {
  if (currentSessionId) return currentSessionId;
  const session = await createSession();
  return session.session_id;
};

/**
 * sendMessage — handles BOTH:
 *  1. SSE streaming  (server sends "data: {...}\n\n" lines)
 *  2. Single JSON    (server sends one big JSON object with a "content" field)
 *
 * Your backend currently returns option 2, so we detect content-type and
 * handle accordingly. When it streams the content word-by-word we simulate
 * the typing effect ourselves so the UI still feels live.
 */
export const sendMessage = async (
  sessionId,
  messageText,
  signal,
  {
    onContentToken,
    onSuggestions,
    onMedia,
    onError,
    onDone,
  } = {}
) => {
  const userId = localStorage.getItem("user_id");

  let response;
  try {
    response = await fetch(`${APP_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      signal,
      body: JSON.stringify({
        content: messageText,
        session_id: sessionId,
        user_id: userId,
      }),
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    onError?.(err.message || "Network error");
    return;
  }

  if (!response.ok) {
    const text = await response.text();
    onError?.(text || `HTTP ${response.status}`);
    return;
  }

  const contentType = response.headers.get("content-type") || "";

  // ── CASE 1: True SSE / text stream ───────────────────────────────────────
  if (contentType.includes("text/event-stream") || contentType.includes("text/plain")) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    const processLine = (line) => {
      if (!line.startsWith("data:")) return;
      const jsonStr = line.slice(5).trim();
      if (!jsonStr) return;

      let event;
      try { event = JSON.parse(jsonStr); } catch { return; }

      switch (event.type) {
        case "content":
          onContentToken?.(event.token ?? "");
          break;
        case "suggestions":
          onSuggestions?.(event.question_suggestions ?? []);
          break;
        case "media":
          onMedia?.({
            videos: event.videos ?? [],
            images: event.images ?? [],
            pdfs: event.pdfs ?? [],
          });
          break;
        case "error":
          onError?.(event.message ?? "Unknown error");
          break;
        default:
          break;
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop();
      for (const part of parts) {
        for (const line of part.split("\n")) {
          processLine(line.trim());
        }
      }
    }

    if (buffer.trim()) {
      for (const line of buffer.split("\n")) {
        processLine(line.trim());
      }
    }

    onDone?.();
    return;
  }

  // CASE 2: Single JSON response (your current backend) ──────────────────
  // Read the full body, parse it, then simulate word-by-word streaming
  // so the UI still shows the typing effect.
  let data;
  try {
    const text = await response.text();
    data = JSON.parse(text);
  } catch (err) {
    onError?.("Failed to parse server response");
    return;
  }

  // The content lives at data.content (your API shape)
  const fullContent = data.content || "";
  const suggestions = data.question_suggestions || [];
  const videos      = data.videos  || data.video_suggestions || [];
  const images      = data.images  || [];
  const pdfs        = data.pdfs    || [];

  if (!fullContent) {
    onError?.("Empty response from server");
    return;
  }

  // Simulate word-by-word streaming so the UI animates
  // Split on spaces but keep the space attached so words join correctly
  const words = fullContent.split(/(?<=\s)|(?=\s)/);

  for (const word of words) {
    // Respect abort signal between words
    if (signal?.aborted) return;

    onContentToken?.(word);

    // Small delay between words — adjust to taste (15–40 ms feels natural)
    await delay(20);
  }

  // Fire suggestions and media after content is done
  if (suggestions.length > 0) {
    onSuggestions?.(suggestions);
  }

  if (videos.length > 0 || images.length > 0 || pdfs.length > 0) {
    onMedia?.({ videos, images, pdfs });
  }

  onDone?.();
};
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


export const saveSession = async (sessionId) => {
  const response = await fetch(
    `${APP_URL}/sessions/save/${sessionId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        session_id: sessionId,
      }),
    }
  );

  const data = await response.json();   // ✅ get response

  if (!response.ok) {
    throw new Error(data.message || "Save failed");
  }

  return data; // ✅ return full response
};


export const getSavedSessions = async () => {
  const userId = localStorage.getItem("user_id");

  if (!userId) {
    throw new Error("User ID not found");
  }

  const response = await fetch(
    `${APP_URL}/sessions/saved/${userId}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch saved sessions");
  }

  return data;
};

export const deleteSession = async (sessionId) => {
  const response = await fetch(`${APP_URL}/sessions/${sessionId}`, {
    method: "DELETE",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Delete failed");
  }

  return data; // ✅ returns { message, session_id }
};


// export const sendMessage = (
//   sessionId,
//   messageText,
//   signal,
//   {
//     onContentToken,
//     onSuggestions,
//     onMedia,
//     onError,
//     onDone,
//   } = {}
// ) => {
//   const userId = localStorage.getItem("user_id");

//   const url = new URL(`${APP_URL}/chat/stream`);
//   url.searchParams.append("message", messageText);
//   url.searchParams.append("session_id", sessionId);
//   url.searchParams.append("user_id", userId);

//   let isClosed = false;

//   const eventSource = new EventSource(url.toString(), {
//     withCredentials: true,
//   });

//   //  Abort handling
//   const cleanup = () => {
//     if (!isClosed) {
//       isClosed = true;
//       eventSource.close();
//     }
//   };

//   if (signal) {
//     signal.addEventListener("abort", cleanup);
//   }

//   //  Main message handler
//   eventSource.onmessage = (event) => {
//     if (!event?.data) return;

//     let data;
//     try {
//       data = JSON.parse(event.data);
//     } catch (err) {
//       console.warn("Invalid JSON chunk:", event.data);
//       return;
//     }

//     switch (data.type) {
//       case "content": {
//         const token = data.token ?? "";

//         // ✅ immediate UI update
//         onContentToken?.(token + " ");
//         break;
//       }

//       case "suggestions":
//         onSuggestions?.(data.question_suggestions ?? []);
//         break;

//       case "media":
//         onMedia?.({
//           videos: data.videos ?? [],
//           images: data.images ?? [],
//           pdfs: data.pdfs ?? [],
//         });
//         break;

//       case "done":
//         onDone?.();
//         cleanup();
//         break;

//       case "error":
//         onError?.(data.message ?? "Unknown error");
//         cleanup();
//         break;

//       default:
//         break;
//     }
//   };

//   // 🔥 Error handling (important for stability)
//   eventSource.onerror = (err) => {
//     console.error("SSE error:", err);

//     // readyState 2 = closed
//     if (eventSource.readyState === 2) {
//       onError?.("Stream closed unexpectedly");
//       cleanup();
//     }
//   };

//   // 🔥 Optional: connection open debug
//   eventSource.onopen = () => {
//     console.log("SSE connected");
//   };

//   // 🔥 Return manual cleanup (important)
//   return cleanup;
// };