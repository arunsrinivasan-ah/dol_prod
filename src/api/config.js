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

  const apiBase = getApiBaseUrl().replace(/\/+$/, "");

  // Match /storage/images/... or /storage/pdf_images/...
  const storageMatch = trimmed.match(/(\/storage\/(?:images|pdf_images)\/[^?\s]+)/i);
  if (storageMatch) {
    return `${apiBase}${storageMatch[1]}`;
  }

  // Match /images/... or /pdf_images/... without /storage
  const imgFolderMatch = trimmed.match(/(\/(?:images|pdf_images)\/[^?\s]+)/i);
  if (imgFolderMatch) {
    return `${apiBase}/storage${imgFolderMatch[1]}`;
  }

  // Raw UUID / filename check
  if (/^[0-9a-fA-F-]{36}(\.[a-zA-Z0-9]+)?$/.test(trimmed)) {
    return `${apiBase}/storage/images/${trimmed}`;
  }

  if (trimmed.startsWith("/")) {
    return `${apiBase}${trimmed}`;
  }

  return trimmed;
};

