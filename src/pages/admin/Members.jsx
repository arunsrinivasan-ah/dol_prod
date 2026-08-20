import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  useTheme,
  Snackbar,
  Alert,
  TextField,
  Button,
  useMediaQuery,
  TableSortLabel,
  Stack,
} from "@mui/material";
import { apiGet, apiPut } from "../../api/client";
import DolphinIconW from "../../assets/images/dolphin_w.png";


const MainLoader = () => (
  <Box
    sx={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: 2,
      minHeight: 280,
    }}
  >
    <Box
      component="img"
      src={DolphinIconW}
      alt="Loading..."
      sx={{
        width: 80,
        height: 80,
        animation: "swimCenter 2s ease-in-out infinite",
        "@keyframes swimCenter": {
          "0%": { transform: "translateY(0px) rotate(0deg)" },
          "25%": { transform: "translateY(-15px) rotate(-10deg)" },
          "50%": { transform: "translateY(0px) rotate(0deg)" },
          "75%": { transform: "translateY(15px) rotate(10deg)" },
          "100%": { transform: "translateY(0px) rotate(0deg)" },
        },
      }}
    />
    <Typography
      variant="body1"
      sx={{
        color: "text.secondary",
        fontWeight: 600,
        animation: "pulseText 2s infinite ease-in-out",
        "@keyframes pulseText": {
          "0%, 100%": { opacity: 0.5 },
          "50%": { opacity: 1 },
        },
      }}
    >
      Loading members...
    </Typography>
  </Box>
);

const ROLE_MAP = {
  1: "USER",
  2: "ADMIN",
  3: "SUPER_ADMIN",
};

const Members = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  // Get current user details from local storage
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const profile = userData.user_profile || userData;
  const currentUserId = profile?.user_id;
  const currentUserRole = profile?.user_role;

  useEffect(() => {
    const timer = setTimeout(() => {
      let isMounted = true;

      const fetchUsers = async () => {
        setLoading(true);
        try {
          // The backend defaults to returning only 10 users if no limit is specified.
          // Setting limit=1000 forces the backend to send all users at once.
          let url = `/users?admin_user_id=${currentUserId}&limit=100&offset=0`;
          if (searchQuery) {
            url += `&search=${encodeURIComponent(searchQuery)}`;
          }

          const data = await apiGet(url);
          if (!isMounted) return;

          if (data && data.users) {
            setUsers(data.users);
          } else if (Array.isArray(data)) {
            setUsers(data);
          } else {
            setUsers([]);
          }
        } catch (err) {
          if (!isMounted) return;
          setUsers([]);
          setSnackbarMessage(err.message || "Failed to load members.");
          setSnackbarSeverity("error");
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

      if (currentUserId) {
        fetchUsers();
      }

      return () => {
        isMounted = false;
      };
    }, 400);

    return () => clearTimeout(timer);
  }, [currentUserId, searchQuery]);

  const handleRoleChange = async (userId, newRoleId) => {
    try {
      await apiPut(`/users/${userId}/role?admin_user_id=${currentUserId}`, {
        role_id: newRoleId,
      });

      // Update local state to reflect the new role
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, role_id: newRoleId } : user
        )
      );

      setSnackbarMessage("Role updated successfully!");
      setSnackbarSeverity("success");
    } catch (err) {
      setSnackbarMessage(err.message || "Failed to update role.");
      setSnackbarSeverity("error");
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarMessage("");
  };

  const handleReset = () => {
    setSearchQuery("");
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = React.useMemo(() => {
    let sortableUsers = [...users];
    if (sortConfig !== null) {
      sortableUsers.sort((a, b) => {
        let aValue = (a[sortConfig.key] || '').toString();
        let bValue = (b[sortConfig.key] || '').toString();

        if (sortConfig.key === 'role_id') {
          aValue = ROLE_MAP[a.role_id] || '';
          bValue = ROLE_MAP[b.role_id] || '';
        }

        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableUsers;
  }, [users, sortConfig]);

  return (
    <Box
      sx={{
        minHeight: "100%",
        bgcolor: theme.palette.background.default,
        py: 3,
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: "text.primary" }}>
          Members Management
        </Typography>

        <Paper
          elevation={0}
          sx={{
            bgcolor: theme.palette.background.paper,
            p: 3,
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider || theme.palette.background.grey}`,
          }}
        >
          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={2}
            alignItems={isMobile ? "stretch" : "flex-end"}
          >
            <TextField
              label="Search Members"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              placeholder="Name, Email, or Phone"
              sx={{ minWidth: isMobile ? "100%" : 300 }}
            />

            <Button
              variant="outlined"
              onClick={handleReset}
              sx={{
                borderRadius: 1,
                textTransform: "none",
                px: 3,
              }}
            >
              Reset
            </Button>
          </Stack>

          <Typography
            variant="body2"
            sx={{
              mt: 2,
              color: theme.palette.text.secondary,
            }}
          >
            {!loading && `Showing ${users.length} results`}
          </Typography>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            bgcolor: theme.palette.background.paper,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider || theme.palette.background.grey}`,
            overflow: "hidden",
          }}
        >
          {loading ? (
            <MainLoader />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? theme.palette.background.light
                          : theme.palette.background.lightblue1,
                    }}
                  >
                    {[
                      { id: 'name', label: 'Name' },
                      { id: 'user_name', label: 'Username' },
                      { id: 'email', label: 'Email' },
                      { id: 'phone_number', label: 'Phone Number' },
                      { id: 'company_name', label: 'Company' },
                      { id: 'role', label: 'Role in Company' },
                      { id: 'user_type', label: 'User Type' },
                      { id: 'ship_name', label: 'Ship Name' },
                      { id: 'ship_type', label: 'Ship Type' },
                      { id: 'role_id', label: 'Platform Role', align: 'right' }
                    ].map((headCell) => (
                      <TableCell
                        key={headCell.id}
                        align={headCell.align || 'left'}
                        sx={{ fontWeight: 600, color: theme.palette.text.primary }}
                      >
                        <TableSortLabel
                          active={sortConfig.key === headCell.id}
                          direction={sortConfig.key === headCell.id ? sortConfig.direction : 'asc'}
                          onClick={() => handleSort(headCell.id)}
                        >
                          {headCell.label}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedUsers.length > 0 ? (
                    sortedUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        sx={{
                          "&:nth-of-type(odd)": {
                            bgcolor:
                              theme.palette.mode === "dark"
                                ? "transparent"
                                : theme.palette.background.light,
                          },
                          "&:hover": {
                            bgcolor:
                              theme.palette.mode === "dark"
                                ? theme.palette.background.light
                                : theme.palette.background.lightblue1,
                          },
                          borderBottom: `1px solid ${theme.palette.divider || theme.palette.background.grey}`,
                        }}
                      >
                        <TableCell sx={{ color: theme.palette.text.primary }}>
                          {user.name || "-"}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.secondary }}>
                          {user.user_name || "-"}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.secondary }}>
                          {user.email || "-"}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.secondary }}>
                          {user.phone_number || "-"}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary }}>
                          {user.company_name || "-"}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary }}>
                          {user.role || "-"}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary }}>
                          {user.user_type || "-"}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary }}>
                          {user.ship_name || "-"}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary }}>
                          {user.ship_type || "-"}
                        </TableCell>
                        <TableCell align="right">
                          <Select
                            value={user.role_id || 1}
                            size="small"
                            disabled={currentUserRole !== "SUPER_ADMIN" || user.id === currentUserId}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            sx={{ minWidth: 120, textAlign: "left" }}
                          >
                            <MenuItem value={1}>USER</MenuItem>
                            <MenuItem value={2}>ADMIN</MenuItem>
                            <MenuItem value={3}>SUPER_ADMIN</MenuItem>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No members found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

      </Container>

      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Members;

