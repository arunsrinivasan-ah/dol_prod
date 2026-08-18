import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/LoginSignup";
import Chatpage from "./pages/chatpage/Chatpage.jsx";
import ChatHistoryAdmin from "./pages/ChatHistoryAdmin.jsx";
import AdminPage from "./pages/admin/AdminPage.jsx";
import './App.css'
import { logout } from "./api/apiAuth.js";

function App() {
  const [userId, setUserId] = useState(null);

  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");

    if (storedUserId) {
      setUserId(storedUserId);
    }

    setAuthLoading(false);
  }, []);

  const handleLoginSuccess = (id) => {
    setUserId(id);
  };

  const handleLogout = async () => {
    await logout()
    localStorage.removeItem("userId");
    localStorage.removeItem("active_session_id");
    setUserId(null);
  };

  if (authLoading) {
    return null;
  }

  return userId ? (
    <Router basename="/dolphin-rb/ui">
      <Routes>
        <Route path="/" element={<Chatpage userId={userId} onLogout={handleLogout} />} />
        <Route path="/admin" element={<AdminPage onLogout={handleLogout} />}>
          <Route index element={<Navigate to="chat-history" replace />} />
          <Route path="chat-history" element={<ChatHistoryAdmin />} />
        </Route>
      </Routes>
    </Router>
  ) : (
    <Login onLoginSuccess={handleLoginSuccess} />
  );
}

export default App;
