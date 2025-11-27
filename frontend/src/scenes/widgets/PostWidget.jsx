import {
  ChatBubbleOutlineOutlined,
  FavoriteBorderOutlined,
  FavoriteOutlined,
  ShareOutlined,
  ArrowUpwardOutlined,
  ArrowDownwardOutlined,
  BookmarkBorderOutlined,
  BookmarkOutlined,
} from "@mui/icons-material";
import { Box, Divider, IconButton, Typography, useTheme, Chip } from "@mui/material";
import FlexBetween from "components/FlexBetween";
import WidgetWrapper from "components/WidgetWrapper";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPost } from "state";
import UserImage from "components/UserImage";

const PostWidget = ({
  postId,
  postUserId,
  name,
  description,
  location,
  picturePath,
  userPicturePath,
  likes,
  comments,
}) => {
  const [isComments, setIsComments] = useState(false);
  const dispatch = useDispatch();
  const token = useSelector((state) => state.token);
  const loggedInUserId = useSelector((state) => state.user._id);

  // Calculate if the current user has liked this post
  // Backend sends likes as an array of user IDs
  const isLiked = likes.some(id => id === loggedInUserId || id._id === loggedInUserId); 
  const likeCount = likes.length;

  const { palette } = useTheme();
  const main = palette.neutral.main;
  const primary = palette.primary.main;

  const patchLike = async () => {
    const response = await fetch(
      `http://localhost:5000/api/posts/${postId}/like`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: loggedInUserId }),
      }
    );
    const updatedPost = await response.json();
    dispatch(setPost({ post: updatedPost }));
  };

  return (
    <WidgetWrapper m="2rem 0">
      {/* HEADER */}
      <FlexBetween gap="1rem">
        <FlexBetween gap="1rem">
          <UserImage image={userPicturePath} size="55px" />
          <Box>
            <Typography
              color={main}
              variant="h5"
              fontWeight="500"
              sx={{
                "&:hover": { color: palette.primary.light, cursor: "pointer" },
              }}
            >
              {name}
            </Typography>
            <Typography color={palette.neutral.medium} fontSize="0.75rem">
              {location || "Campus Feed"}
            </Typography>
          </Box>
        </FlexBetween>
        {/* Optional: Add Category Chip here if available */}
        <Chip label="Announcement" size="small" color="primary" variant="outlined" />
      </FlexBetween>

      {/* BODY */}
      <Typography color={main} sx={{ mt: "1rem", fontWeight: "bold", fontSize: "1.1rem" }}>
         {/* Placeholder for Title if we add it later, using description first line or just description */}
         {description}
      </Typography>
      
      {picturePath && (
        <img
          width="100%"
          height="auto"
          alt="post"
          style={{ borderRadius: "0.75rem", marginTop: "0.75rem" }}
          src={`http://localhost:5000/assets/${picturePath}`}
        />
      )}

      {/* FOOTER */}
      <FlexBetween mt="1rem">
        {/* VOTE SECTION */}
        <Box display="flex" alignItems="center" backgroundColor={palette.neutral.light} borderRadius="0.5rem">
            <IconButton onClick={patchLike} size="small">
              <ArrowUpwardOutlined sx={{ color: isLiked ? primary : main }} />
            </IconButton>
            <Typography color={main} sx={{ mx: "0.5rem", fontWeight: "bold" }}>
                {likeCount}
            </Typography>
             <IconButton size="small">
              <ArrowDownwardOutlined sx={{ color: main }} />
            </IconButton>
        </Box>

        <FlexBetween gap="1rem">
             {/* COMMENT SECTION */}
            <IconButton onClick={() => setIsComments(!isComments)}>
              <ChatBubbleOutlineOutlined />
            </IconButton>
            <Typography>{comments.length}</Typography>

            <IconButton>
              <ShareOutlined />
            </IconButton>
            
             <IconButton>
              <BookmarkBorderOutlined />
            </IconButton>
        </FlexBetween>
      </FlexBetween>

      {/* COMMENT DROPDOWN */}
      {isComments && (
        <Box mt="0.5rem">
          {comments.map((comment, i) => (
            <Box key={`${name}-${i}`}>
              <Divider />
              <Typography sx={{ color: main, m: "0.5rem 0", pl: "1rem" }}>
                {comment}
              </Typography>
            </Box>
          ))}
          <Divider />
        </Box>
      )}
    </WidgetWrapper>
  );
};

export default PostWidget;
