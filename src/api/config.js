export const getApiBaseUrl = () => {
  const envUrl = process.env.REACT_APP_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location) {
    const { hostname, protocol, port, origin } = window.location;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      if (port === "3000" || port === "3001" || port === "3002" || port === "5173") {
        return `${protocol}//${hostname}:8000`;
      }
      return origin;
    }
  }

  return "http://localhost:8000";
};

export const APP_URL = getApiBaseUrl();

export const resolveImageUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("data:")) return trimmed;

  const storageMatch = trimmed.match(/(\/storage\/(?:images|pdf_images)\/[^?\s]+)/i);
  if (storageMatch) {
    const cleanPath = storageMatch[1];
    if (
      /^https?:\/\//i.test(trimmed) &&
      !trimmed.includes("localhost") &&
      !trimmed.includes("127.0.0.1")
    ) {
      return trimmed;
    }
    const apiBase = getApiBaseUrl();
    return `${apiBase.replace(/\/+$/, "")}${cleanPath}`;
  }

  if (trimmed.startsWith("/")) {
    const apiBase = getApiBaseUrl();
    return `${apiBase.replace(/\/+$/, "")}${trimmed}`;
  }

  return trimmed;
};
