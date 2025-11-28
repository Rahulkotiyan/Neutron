import { Box, Typography, useTheme, useMediaQuery, Divider, InputBase, IconButton, List, ListItem, ListItemButton, ListItemText, Avatar } from "@mui/material";
import { SendOutlined, GroupsOutlined, SchoolOutlined, SportsEsportsOutlined } from "@mui/icons-material";
import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import Navbar from "scenes/navbar";
import Sidebar from "scenes/widgets/Sidebar";
import FlexBetween from "components/FlexBetween";
import WidgetWrapper from "components/WidgetWrapper";

const GroupsPage = () => {
  const isNonMobileScreens = useMediaQuery("(min-width:1000px)");
  const theme = useTheme();
  const { _id, picturePath } = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  const getGroups = async () => {
    const response = await fetch("http://localhost:5000/api/groups", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setGroups(data);
    if (data.length > 0 && !selectedGroup) {
        setSelectedGroup(data[0]);
    }
  };

  const getMessages = async () => {
    if (!selectedGroup) return;
    const response = await fetch(`http://localhost:5000/api/groups/${selectedGroup._id}/messages`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setMessages(data);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedGroup) return;
    
    const response = await fetch(`http://localhost:5000/api/groups/${selectedGroup._id}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: _id, content: newMessage }),
    });
    const data = await response.json();
    setMessages(data);
    setNewMessage("");
  };

  useEffect(() => {
    getGroups();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    getMessages();
    // Set up polling for real-time-ish updates
    const interval = setInterval(getMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedGroup]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Group Icon Helper
  const getGroupIcon = (type) => {
    switch(type) {
        case "Department": return <SchoolOutlined />;
        case "Club": return <SportsEsportsOutlined />;
        default: return <GroupsOutlined />;
    }
  };

  return (
    <Box display="flex" width="100%" height="100vh" overflow="hidden">
      {/* LEFT COLUMN: Sidebar */}
      {isNonMobileScreens && (
        <Box flexBasis="20%" minWidth="250px">
          <Sidebar />
        </Box>
      )}

      {/* MAIN CONTENT: Groups Layout */}
      <Box
        flexBasis={isNonMobileScreens ? "80%" : "100%"}
        height="100%"
        display="flex"
      >
        {/* GROUPS LIST SIDEBAR */}
        <Box 
            flexBasis="25%" 
            backgroundColor={theme.palette.background.alt} 
            p="1rem" 
            borderRight={`1px solid ${theme.palette.neutral.light}`}
            overflow="auto"
        >
            <Typography variant="h5" fontWeight="bold" mb="1rem">Groups</Typography>
            <List>
                {groups.map((group) => (
                    <ListItem key={group._id} disablePadding>
                        <ListItemButton 
                            selected={selectedGroup?._id === group._id}
                            onClick={() => setSelectedGroup(group)}
                            sx={{
                                borderRadius: "0.5rem",
                                mb: "0.5rem",
                                "&.Mui-selected": {
                                    backgroundColor: theme.palette.primary.light,
                                    "&:hover": { backgroundColor: theme.palette.primary.light },
                                }
                            }}
                        >
                            <Box mr="0.5rem" color={theme.palette.primary.main}>
                                {getGroupIcon(group.type)}
                            </Box>
                            <ListItemText 
                                primary={group.name} 
                                secondary={group.type}
                                primaryTypographyProps={{ fontWeight: "bold" }}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>

        {/* CHAT AREA */}
        <Box flexBasis="75%" display="flex" flexDirection="column" height="100%">
            {/* CHAT HEADER */}
            <Box p="1rem 2rem" backgroundColor={theme.palette.background.alt} borderBottom={`1px solid ${theme.palette.neutral.light}`}>
                <FlexBetween>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            {selectedGroup ? selectedGroup.name : "Select a Group"}
                        </Typography>
                        <Typography variant="body2" color={theme.palette.neutral.medium}>
                            {selectedGroup ? selectedGroup.description : ""}
                        </Typography>
                    </Box>
                </FlexBetween>
            </Box>

            {/* MESSAGES LIST */}
            <Box flexGrow={1} overflow="auto" p="2rem" display="flex" flexDirection="column" gap="1rem">
                {messages.map((msg) => {
                    const isMe = msg.userId._id === _id;
                    return (
                        <Box 
                            key={msg._id} 
                            display="flex" 
                            justifyContent={isMe ? "flex-end" : "flex-start"}
                            gap="1rem"
                        >
                            {!isMe && (
                                <Avatar src={`http://localhost:5000/assets/${msg.userId.picturePath}`} />
                            )}
                            <Box>
                                <Box 
                                    backgroundColor={isMe ? theme.palette.primary.main : theme.palette.neutral.light}
                                    color={isMe ? "#fff" : theme.palette.neutral.dark}
                                    p="0.75rem 1rem"
                                    borderRadius="1rem"
                                    sx={{
                                        borderTopRightRadius: isMe ? "0" : "1rem",
                                        borderTopLeftRadius: !isMe ? "0" : "1rem",
                                    }}
                                >
                                    <Typography>{msg.content}</Typography>
                                </Box>
                                <Typography variant="caption" color={theme.palette.neutral.medium} display="block" textAlign={isMe ? "right" : "left"} mt="0.25rem">
                                    {msg.userId.firstName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                            </Box>
                        </Box>
                    )
                })}
                <div ref={messagesEndRef} />
            </Box>

            {/* INPUT AREA */}
            <Box p="1.5rem" backgroundColor={theme.palette.background.alt} borderTop={`1px solid ${theme.palette.neutral.light}`}>
                <FlexBetween 
                    backgroundColor={theme.palette.neutral.light} 
                    borderRadius="2rem" 
                    p="0.5rem 1.5rem"
                >
                    <InputBase 
                        placeholder="Send a message..." 
                        fullWidth
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <IconButton onClick={handleSendMessage} disabled={!newMessage.trim()}>
                        <SendOutlined sx={{ color: theme.palette.primary.main }} />
                    </IconButton>
                </FlexBetween>
            </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default GroupsPage;
