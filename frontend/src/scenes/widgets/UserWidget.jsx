import {
  ManageAccountsOutlined,
  EditOutlined,
  LocationOnOutlined,
  WorkOutlineOutlined,
} from "@mui/icons-material";
import { Box, Typography, Divider, useTheme } from "@mui/material";
import UserImage from "components/UserImage";
import FlexBetween from "components/FlexBetween";
import WidgetWrapper from "components/WidgetWrapper";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const UserWidget = ({ userId, picturePath }) => {
  const [user, setUser] = useState(null);
  const { palette } = useTheme();
  const navigate = useNavigate();
  const token = useSelector((state) => state.token);
  const dark = palette.neutral.dark;
  const medium = palette.neutral.medium;
  const main = palette.neutral.main;

  const getUser = async () => {
    // In a real app, you'd fetch this. For now, we rely on Redux or fetch if needed.
    // We will just fetch to ensure we have fresh stats.
    // Note: We didn't create a GET /users/:id route in Phase 2,
    // so strictly for this phase, we will assume user data comes from props or state.
    // However, here is how the fetch logic looks:
    /*
    const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setUser(data);
    */
  };

  // Quick Fix: Use Redux user if props match
  const loggedInUser = useSelector((state) => state.user);

  useEffect(() => {
    // getUser();
    setUser(loggedInUser); // Simulating fetch for now
  }, []);

  if (!user) {
    return null;
  }

  const {
    username,
    collegeId,
    department,
    year,
    reputationPoints = 0,
    badges = [],
  } = user;

  return (
    <WidgetWrapper>
      {/* FIRST ROW: User Info */}
      <FlexBetween
        gap="0.5rem"
        pb="1.1rem"
        onClick={() => navigate(`/profile/${userId}`)}
      >
        <FlexBetween gap="1rem">
          <UserImage image={picturePath} />
          <Box>
            <Typography
              variant="h4"
              color={dark}
              fontWeight="500"
              sx={{
                "&:hover": {
                  color: palette.primary.light,
                  cursor: "pointer",
                },
              }}
            >
              {username}
            </Typography>
            <Typography color={medium}>{department} Dept.</Typography>
          </Box>
        </FlexBetween>
        <ManageAccountsOutlined />
      </FlexBetween>

      <Divider />

      {/* SECOND ROW: Academic Details */}
      <Box p="1rem 0">
        <Box display="flex" alignItems="center" gap="1rem" mb="0.5rem">
          <WorkOutlineOutlined fontSize="large" sx={{ color: main }} />
          <Typography color={medium}>College ID: {collegeId}</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap="1rem">
          <LocationOnOutlined fontSize="large" sx={{ color: main }} />
          <Typography color={medium}>Year: {year}</Typography>
        </Box>
      </Box>

      <Divider />

      {/* THIRD ROW: Gamification */}
      <Box p="1rem 0">
        <FlexBetween mb="0.5rem">
          <Typography color={medium}>Reputation Points</Typography>
          <Typography color={main} fontWeight="500">
            {reputationPoints}
          </Typography>
        </FlexBetween>
        <FlexBetween>
          <Typography color={medium}>Badges</Typography>
          <Typography color={main} fontWeight="500">
            {badges.length}
          </Typography>
        </FlexBetween>
      </Box>
    </WidgetWrapper>
  );
};

export default UserWidget;
