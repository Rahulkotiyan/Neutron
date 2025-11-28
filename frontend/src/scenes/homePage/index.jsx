import { Box, useMediaQuery } from "@mui/material";
import { useState } from "react";
import { useSelector } from "react-redux";
import Navbar from "scenes/navbar";
import UserWidget from "scenes/widgets/UserWidget";
import MyPostWidget from "scenes/widgets/MyPostWidget";
import PostsWidget from "scenes/widgets/PostsWidget";
import AdvertWidget from "scenes/widgets/AdvertWidget";
import Sidebar from "scenes/widgets/Sidebar";
import RightSidebar from "scenes/widgets/RightSidebar";

const HomePage = () => {
  const isNonMobileScreens = useMediaQuery("(min-width:1000px)");
  const { _id, picturePath } = useSelector((state) => state.user);
  
  // Feed State
  const [feedSort, setFeedSort] = useState("new");
  const [feedCategory, setFeedCategory] = useState("all");

  return (
    <Box display="flex" width="100%" height="100vh" overflow="hidden">
      {/* LEFT COLUMN: Sidebar */}
      {isNonMobileScreens && (
        <Box flexBasis="20%" minWidth="250px">
          <Sidebar />
        </Box>
      )}

      {/* MIDDLE COLUMN: Feed */}
      <Box
        flexBasis={isNonMobileScreens ? "55%" : "100%"}
        overflow="auto"
        padding="2rem 5%"
      >
        {/* Mobile Navbar if needed, or keep it top */}
        {!isNonMobileScreens && <Navbar />} 
        
        <MyPostWidget 
          picturePath={picturePath} 
          feedSort={feedSort}
          setFeedSort={setFeedSort}
          feedCategory={feedCategory}
          setFeedCategory={setFeedCategory}
        />
        <PostsWidget 
          userId={_id} 
          feedSort={feedSort}
          feedCategory={feedCategory}
        />
      </Box>

      {/* RIGHT COLUMN: Widgets */}
      {isNonMobileScreens && (
        <Box flexBasis="25%" padding="2rem 2rem 0 0" overflow="auto">
          <RightSidebar />
        </Box>
      )}
    </Box>
  );
};

export default HomePage;
