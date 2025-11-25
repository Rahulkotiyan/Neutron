import { useState } from "react";
import {
  Box,
  IconButton,
  InputBase,
  Typography,
  Select,
  MenuItem,
  FormControl,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Search,
  Message,
  DarkMode,
  LightMode,
  Notifications,
  Help,
  Menu,
  Close,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { setMode, setLogout } from "state";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");

  const theme = useTheme();
  const neutralLight = theme.palette?.neutral?.light || "#F0F0F0";
  const dark = "#333333";
  const background = "#FFFFFF";
  const primaryLight = "#00D5FA";
  const alt = "#F6F6F6";

  const fullName = user ? `${user.username}` : "Guest";

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      padding="1rem 6%"
      backgroundColor={background}
      boxShadow="0px 2px 10px rgba(0,0,0,0.1)"
    >
      {/* LOGO */}
      <Box display="flex" alignItems="center" gap="1.75rem">
        <Typography
          fontWeight="bold"
          fontSize="clamp(1rem, 2rem, 2.25rem)"
          color="primary"
          onClick={() => navigate("/home")}
          sx={{ "&:hover": { color: primaryLight, cursor: "pointer" } }}
        >
          Neutron
        </Typography>
        {isNonMobileScreens && (
          <Box
            display="flex"
            backgroundColor={neutralLight}
            borderRadius="9px"
            gap="3rem"
            padding="0.1rem 1.5rem"
          >
            <InputBase placeholder="Search..." />
            <IconButton>
              <Search />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* DESKTOP NAV */}
      {isNonMobileScreens ? (
        <Box display="flex" gap="2rem">
          <IconButton onClick={() => dispatch(setMode())}>
            <DarkMode sx={{ fontSize: "25px" }} />
          </IconButton>
          <Message sx={{ fontSize: "25px" }} />
          <Notifications sx={{ fontSize: "25px" }} />
          <FormControl variant="standard" value={fullName}>
            <Select
              value={fullName}
              sx={{
                backgroundColor: neutralLight,
                width: "150px",
                borderRadius: "0.25rem",
                p: "0.25rem 1rem",
              }}
              input={<InputBase />}
            >
              <MenuItem value={fullName}>
                <Typography>{fullName}</Typography>
              </MenuItem>
              <MenuItem onClick={() => dispatch(setLogout())}>Log Out</MenuItem>
            </Select>
          </FormControl>
        </Box>
      ) : (
        <IconButton>
          <Menu />
        </IconButton>
      )}
    </Box>
  );
};

export default Navbar;
