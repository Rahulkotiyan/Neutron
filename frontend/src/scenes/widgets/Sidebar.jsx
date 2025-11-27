import {
  Box,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
} from "@mui/material";
import {
  HomeOutlined,
  GroupsOutlined,
  FeedOutlined,
  MessageOutlined,
  SchoolOutlined,
  StorefrontOutlined,
  CalendarTodayOutlined,
  LibraryBooksOutlined,
  CampaignOutlined,
  VisibilityOffOutlined,
  SettingsOutlined,
  LogoutOutlined,
} from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FlexBetween from "components/FlexBetween";
import UserImage from "components/UserImage";
import { useSelector } from "react-redux";

const navItems = [
  {
    text: "Home",
    icon: <HomeOutlined />,
    path: "/home",
  },
  {
    text: "Groups",
    icon: <GroupsOutlined />,
    path: "/groups",
  },
  {
    text: "Campus Feed",
    icon: <FeedOutlined />,
    path: "/feed",
  },
  {
    text: "Messages",
    icon: <MessageOutlined />,
    path: "/messages",
  },
  {
    text: "Mentorship",
    icon: <SchoolOutlined />,
    path: "/mentorship",
  },
  {
    text: "Marketplace",
    icon: <StorefrontOutlined />,
    path: "/market",
  },
  {
    text: "Timetable",
    icon: <CalendarTodayOutlined />,
    path: "/timetable",
  },
  {
    text: "Resources",
    icon: <LibraryBooksOutlined />,
    path: "/resources",
  },
  {
    text: "Official Notices",
    icon: <CampaignOutlined />,
    path: "/notices",
  },
  {
    text: "Anonymous Confessions",
    icon: <VisibilityOffOutlined />,
    path: "/confessions",
  },
];

const Sidebar = () => {
  const { palette } = useTheme();
  const { pathname } = useLocation();
  const [active, setActive] = useState("");
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);

  useEffect(() => {
    setActive(pathname.substring(1));
  }, [pathname]);

  if (!user) {
    return null;
  }

  const { firstName, lastName, picturePath, occupation } = user;

  return (
    <Box
      component="nav"
      sx={{
        background: palette.primary.main, // Dark blue sidebar
        color: "#fff",
        height: "100vh",
        position: "sticky",
        top: 0,
        overflowY: "auto",
        width: "250px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "1rem 0",
        borderRadius: "0 20px 20px 0",
      }}
    >
      <Box>
        <Box m="1.5rem 2rem 2rem 3rem">
          <FlexBetween color="#fff">
            <Box display="flex" alignItems="center" gap="0.5rem">
              <Typography variant="h4" fontWeight="bold">
                NEUTRON
              </Typography>
            </Box>
          </FlexBetween>
          <Typography variant="caption" color="rgba(255,255,255,0.7)">
            Dr. Ambedkar Institute of Technology
          </Typography>
        </Box>

        <List>
          {navItems.map(({ text, icon, path }) => {
            const lcText = path.substring(1);
            return (
              <ListItem key={text} disablePadding>
                <ListItemButton
                  onClick={() => {
                    navigate(path);
                    setActive(lcText);
                  }}
                  sx={{
                    backgroundColor:
                      active === lcText
                        ? "rgba(255, 255, 255, 0.2)"
                        : "transparent",
                    color: "#fff",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                    paddingLeft: "3rem",
                  }}
                >
                  <ListItemIcon
                    sx={{
                      ml: "0.5rem",
                      color: "#fff",
                    }}
                  >
                    {icon}
                  </ListItemIcon>
                  <ListItemText primary={text} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Box m="2rem">
        <Divider sx={{ backgroundColor: "rgba(255,255,255,0.2)" }} />
        <FlexBetween textTransform="none" gap="1rem" m="1.5rem 2rem 0 1rem">
          <UserImage image={picturePath} size="40px" />
          <Box textAlign="left">
            <Typography
              fontWeight="bold"
              fontSize="0.9rem"
              sx={{ color: "#fff" }}
            >
              {firstName} {lastName}
            </Typography>
            <Typography
              fontSize="0.8rem"
              sx={{ color: "rgba(255,255,255,0.7)" }}
            >
              View Profile
            </Typography>
          </Box>
          <IconButton>
            <LogoutOutlined sx={{ color: "#fff" }} />
          </IconButton>
        </FlexBetween>
      </Box>
    </Box>
  );
};

export default Sidebar;
