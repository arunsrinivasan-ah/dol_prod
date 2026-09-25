import React from 'react';
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText, ListItemButton } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import GroupIcon from '@mui/icons-material/Group';
import RateReviewIcon from '@mui/icons-material/RateReview';
import { useThemeMode } from '../../context/ThemeModeContext';
import { getSidebarWidth } from '../../theme/layoutScale';
import { useNavigate, useLocation } from 'react-router-dom';

const AdminSidebar = ({ setSidebarOpen }) => {
  const { fontLevel } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      title: 'Feedback & Learning',
      icon: <RateReviewIcon />,
      path: '/admin/feedback'
    },
    {
      title: 'Chat History',
      icon: <HistoryIcon />,
      path: '/admin/chat-history'
    },
    {
      title: 'Members',
      icon: <GroupIcon />,
      path: '/admin/members'
    }
  ];

  return (
    <Box
      sx={{
        width: { xs: "100%", md: getSidebarWidth(fontLevel) },
        p: 2,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        bgcolor: "background.sidebar",
        height: { xs: "100vh", md: "90vh" },
        borderRight: "1px solid",
        borderColor: "divider"
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, px: 2, color: 'text.primary' }}>
        Admin Panel
      </Typography>
      
      <List sx={{ width: '100%' }}>
        {menuItems.map((item) => {
          const isActive = location.pathname.includes(item.path);
          return (
            <ListItem key={item.title} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                selected={isActive}
                onClick={() => {
                  navigate(item.path);
                  if (setSidebarOpen) setSidebarOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    }
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: isActive ? 'primary.contrastText' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.title} 
                  primaryTypographyProps={{ 
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.9rem'
                  }} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default AdminSidebar;
