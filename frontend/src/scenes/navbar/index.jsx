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
import { Storefront, LibraryBooks } from "@mui/icons-material";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const token = useSelector((state) => state.token);
  const theme = useTheme();
  const neutralLight = theme.palette?.neutral?.light || "#F0F0F0";
  const dark = "#333333";
  const background = "#FFFFFF";
  const primaryLight = "#00D5FA";
  const alt = "#F6F6F6";

  const fullName = user ? `${user.username}` : "Guest";

  const handleSearch = async () => {
    if (!searchQuery) return;

    const response = await fetch(
      `http://localhost:5000/api/users/search?query=${searchQuery}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }, // You need to add 'token' to useSelector at top
      }
    );
    const data = await response.json();
    setSearchResults(data);
  };

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
          <IconButton onClick={() => navigate("/market")}>
            <Storefront sx={{ fontSize: "25px" }} />
          </IconButton>

          <IconButton onClick={() => navigate("/resources")}>
            <LibraryBooks sx={{ fontSize: "25px" }} />
          </IconButton>

          <IconButton onClick={() => dispatch(setMode())}>
            <DarkMode sx={{ fontSize: "25px" }} />
          </IconButton>
        </Box>
      ) : (
        <IconButton>
          <Menu />
        </IconButton>
      )}
  {user && user.isAdmin && (
    <Button
      onClick={() => navigate("/admin")}
      sx={{ color: dark, fontWeight: "bold" }}
    >
      ADMIN PANEL
    </Button>
  )}

  {/* SEARCH BAR SECTION */}
  <Box display="flex" flexDirection="column" position="relative">
      <Box display="flex" backgroundColor={neutralLight} borderRadius="9px" gap="3rem" padding="0.1rem 1.5rem">
        <InputBase 
            placeholder="Search User..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if(e.key === 'Enter') handleSearch(); }}
        />
        <IconButton onClick={handleSearch}><Search /></IconButton>
      </Box>
      
      {/* SEARCH RESULTS DROPDOWN */}
      {searchResults.length > 0 && (
          <Box 
            position="absolute" 
            top="40px" 
            width="100%" 
            backgroundColor={background} 
            boxShadow="0px 4px 12px rgba(0,0,0,0.1)"
            borderRadius="5px"
            zIndex="10"
            p="0.5rem"
          >
              {searchResults.map((u) => (
                  <Box 
                    key={u._id} 
                    p="0.5rem" 
                    sx={{ "&:hover": { bgcolor: neutralLight, cursor: "pointer" } }}
                    onClick={() => {
                        navigate(`/profile/${u._id}`);
                        setSearchResults([]); // Close dropdown
                        setSearchQuery("");
                    }}
                  >
                      <Typography fontWeight="bold">{u.username}</Typography>
                      <Typography fontSize="0.8rem" color="gray">{u.collegeId}</Typography>
                  </Box>
              ))}
          </Box>
      )}
      </Box>
    </Box>
  );
};

export default Navbar;
