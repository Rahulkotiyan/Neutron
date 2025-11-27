import {
  Box,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Navbar from "scenes/navbar";
import WidgetWrapper from "components/WidgetWrapper";
import FlexBetween from "components/FlexBetween";
import {
  Group,
  Article,
  Storefront,
  LibraryBooks,
  Delete,
} from "@mui/icons-material";

const AdminPage = () => {
  const [stats, setStats] = useState(null);
  const token = useSelector((state) => state.token);
  const user = useSelector((state) => state.user);
  const { palette } = useTheme();
  const isNonMobile = useMediaQuery("(min-width:1000px)");

  // 1. Fetch Stats
  const getStats = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.log("Not authorized or error fetching stats");
    }
  };

  // 2. Ban User Function
  const handleBan = async (userId) => {
    if (!window.confirm("Are you sure you want to ban this user?")) return;

    await fetch(`http://localhost:5000/api/admin/user/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    getStats(); // Refresh
  };

  useEffect(() => {
    getStats();
  }, []);

  if (!user || !user.isAdmin) {
    return <Box p="2rem">Access Denied: You are not an admin.</Box>;
  }

  if (!stats) return null;

  return (
    <Box>
      <Navbar />
      <Box padding="2rem 6%">
        <Typography variant="h3" fontWeight="bold" mb="2rem">
          Admin Dashboard
        </Typography>

        {/* STATS GRID */}
        <Box
          display="grid"
          gridTemplateColumns={isNonMobile ? "repeat(4, 1fr)" : "1fr"}
          gap="20px"
          mb="3rem"
        >
          <StatCard
            title="Total Users"
            count={stats.totalUsers}
            icon={<Group sx={{ fontSize: "40px" }} />}
          />
          <StatCard
            title="Total Posts"
            count={stats.totalPosts}
            icon={<Article sx={{ fontSize: "40px" }} />}
          />
          <StatCard
            title="Market Items"
            count={stats.totalMarketItems}
            icon={<Storefront sx={{ fontSize: "40px" }} />}
          />
          <StatCard
            title="Resources"
            count={stats.totalResources}
            icon={<LibraryBooks sx={{ fontSize: "40px" }} />}
          />
        </Box>

        {/* RECENT USERS TABLE */}
        <WidgetWrapper>
          <Typography variant="h5" fontWeight="bold" mb="1rem">
            Recent Registrations
          </Typography>
          <Box display="flex" flexDirection="column" gap="1rem">
            {stats.recentUsers.map((u) => (
              <FlexBetween key={u._id} p="0.5rem" borderBottom="1px solid #ccc">
                <Box>
                  <Typography fontWeight="bold">{u.username}</Typography>
                  <Typography fontSize="0.8rem" color={palette.neutral.medium}>
                    {u.email}
                  </Typography>
                  <Typography fontSize="0.8rem">
                    {u.collegeId} | {u.department}
                  </Typography>
                </Box>
                {!u.isAdmin && (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => handleBan(u._id)}
                  >
                    Ban
                  </Button>
                )}
              </FlexBetween>
            ))}
          </Box>
        </WidgetWrapper>
      </Box>
    </Box>
  );
};

// Helper Component for the Grid Cards
const StatCard = ({ title, count, icon }) => {
  const { palette } = useTheme();
  return (
    <WidgetWrapper
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <Box color={palette.primary.main} mb="0.5rem">
        {icon}
      </Box>
      <Typography variant="h4" fontWeight="bold">
        {count}
      </Typography>
      <Typography color={palette.neutral.medium}>{title}</Typography>
    </WidgetWrapper>
  );
};

export default AdminPage;
