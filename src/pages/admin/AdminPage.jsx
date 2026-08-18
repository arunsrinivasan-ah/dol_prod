import React, { useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import Header from "../../components/header/Header";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";

const AdminPage = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <MainLayout
      header={
        <Header
          onLogout={onLogout}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          drawerContent={<AdminSidebar setSidebarOpen={setSidebarOpen} />}
        />
      }
      leftPanel={<AdminSidebar setSidebarOpen={setSidebarOpen} />}
      contentPanel={
        <Box sx={{ flex: 1, overflowY: "auto", bgcolor: 'background.default', height: "100%" }}>
          <Outlet />
        </Box>
      }
    />
  );
};

export default AdminPage;
