import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Members from "./pages/admin/Members.jsx";
import Login from "./pages/LoginSignup";
import Chatpage from "./pages/chatpage/Chatpage.jsx";
import ChatHistoryAdmin from "./pages/ChatHistoryAdmin.jsx";
import AdminPage from "./pages/admin/AdminPage.jsx";
import './App.css'
import { logout } from "./api/apiAuth.js";

function App() {
  const [userId, setUserId] = useState(null);

  const [authLoading, setAuthLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const storedUserData = localStorage.getItem("userData");

    if (storedUserId) {
      setUserId(storedUserId);
    }

    if (storedUserData) {
      try {
        const parsedData = JSON.parse(storedUserData);
        setUserRole(parsedData.user_role);
      } catch (e) {
        console.error("Error parsing user data");
      }
    }

    setAuthLoading(false);
  }, []);

  const handleLoginSuccess = (id) => {
    setUserId(id);
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
      try {
        const parsedData = JSON.parse(storedUserData);
        setUserRole(parsedData.user_role);
      } catch (e) {
        console.error("Error parsing user data");
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem("userId");
    localStorage.removeItem("user_id");
    localStorage.removeItem("userData");
    localStorage.removeItem("active_session_id");
    setUserId(null);
    setUserRole(null);
    window.history.replaceState(null, "", "/dolphin-rb/ui");
  };

  if (authLoading) {
    return null;
  }

  return userId ? (
    <Router basename="/dolphin-rb/ui">
      <Routes>
        <Route path="/" element={<Chatpage userId={userId} setUserId={setUserId} onLogout={handleLogout} />} />
        <Route path="/admin" element={
          userRole === "ADMIN" || userRole === "SUPER_ADMIN" ?
            <AdminPage onLogout={handleLogout} />
            : <Navigate to="/" replace />
        }>
          <Route index element={<Navigate to="chat-history" replace />} />
          <Route path="chat-history" element={<ChatHistoryAdmin />} />
          <Route path="members" element={<Members />} />
        </Route>
      </Routes>
    </Router>
  ) : (
    <Login onLoginSuccess={handleLoginSuccess} />
  );
}

export default App;
