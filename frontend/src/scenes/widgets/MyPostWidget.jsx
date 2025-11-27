import {
  EditOutlined,
  DeleteOutlined,
  AttachFileOutlined,
  GifBoxOutlined,
  ImageOutlined,
  MicOutlined,
  MoreHorizOutlined,
  VideoCameraBackOutlined,
  LinkOutlined,
  PollOutlined,
} from "@mui/icons-material";
import {
  Box,
  Divider,
  Typography,
  InputBase,
  useTheme,
  Button,
  IconButton,
  useMediaQuery,
  Stack,
  Chip,
} from "@mui/material";
import FlexBetween from "components/FlexBetween";
import Dropzone from "react-dropzone";
import UserImage from "components/UserImage";
import WidgetWrapper from "components/WidgetWrapper";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "state";

const MyPostWidget = ({ picturePath }) => {
  const dispatch = useDispatch();
  const [isImage, setIsImage] = useState(false);
  const [image, setImage] = useState(null);
  const [post, setPost] = useState("");
  const { palette } = useTheme();
  const { _id, firstName } = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");
  const mediumMain = palette.neutral.mediumMain;
  const medium = palette.neutral.medium;

  const handlePost = async () => {
    const formData = new FormData();
    formData.append("userId", _id);
    formData.append("content", post);
    if (image) {
      formData.append("picture", image);
      formData.append("image", image.name);
    }

    const response = await fetch(`http://localhost:5000/api/posts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const posts = await response.json();
    dispatch(setPosts({ posts }));
    setImage(null);
    setPost("");
  };

  return (
    <WidgetWrapper mb="2rem">
      <FlexBetween gap="1.5rem">
        <InputBase
          placeholder={`What's on your mind, ${firstName}?`}
          onChange={(e) => setPost(e.target.value)}
          value={post}
          sx={{
            width: "100%",
            backgroundColor: palette.neutral.light,
            borderRadius: "2rem",
            padding: "1rem 2rem",
          }}
        />
        <Button
          disabled={!post}
          onClick={handlePost}
          sx={{
            color: "#fff",
            backgroundColor: palette.primary.main,
            borderRadius: "3rem",
            padding: "0.5rem 2rem",
            "&:hover": {
              backgroundColor: palette.primary.dark,
            },
          }}
        >
          Post
        </Button>
      </FlexBetween>

      {isImage && (
        <Box
          border={`1px solid ${medium}`}
          borderRadius="5px"
          mt="1rem"
          p="1rem"
        >
          <Dropzone
            acceptedFiles=".jpg,.jpeg,.png"
            multiple={false}
            onDrop={(acceptedFiles) => setImage(acceptedFiles[0])}
          >
            {({ getRootProps, getInputProps }) => (
              <FlexBetween>
                <Box
                  {...getRootProps()}
                  border={`2px dashed ${palette.primary.main}`}
                  p="1rem"
                  width="100%"
                  sx={{ "&:hover": { cursor: "pointer" } }}
                >
                  <input {...getInputProps()} />
                  {!image ? (
                    <p>Add Image Here</p>
                  ) : (
                    <FlexBetween>
                      <Typography>{image.name}</Typography>
                      <EditOutlined />
                    </FlexBetween>
                  )}
                </Box>
                {image && (
                  <IconButton
                    onClick={() => setImage(null)}
                    sx={{ width: "15%" }}
                  >
                    <DeleteOutlined />
                  </IconButton>
                )}
              </FlexBetween>
            )}
          </Dropzone>
        </Box>
      )}

      <Box display="flex" gap="1rem" mt="1rem" mb="1rem">
        <Button
          onClick={() => setIsImage(!isImage)}
          startIcon={<ImageOutlined />}
          sx={{
            color: "#fff",
            backgroundColor: "#4CAF50", // Green
            borderRadius: "0.5rem",
            textTransform: "none",
            "&:hover": { backgroundColor: "#388E3C" },
          }}
        >
          Image/Video
        </Button>
        <Button
          startIcon={<LinkOutlined />}
          sx={{
            color: "#fff",
            backgroundColor: "#FF9800", // Orange
            borderRadius: "0.5rem",
            textTransform: "none",
            "&:hover": { backgroundColor: "#F57C00" },
          }}
        >
          Link
        </Button>
        <Button
            startIcon={<PollOutlined />}
            sx={{
                color: "#fff",
                backgroundColor: "#9C27B0", // Purple
                borderRadius: "0.5rem",
                textTransform: "none",
                "&:hover": { backgroundColor: "#7B1FA2" },
            }}
        >
            Poll
        </Button>
      </Box>

      <Divider />

      <Stack direction="row" spacing={1} mt="1rem" alignItems="center">
        <IconButton size="small" sx={{ backgroundColor: palette.neutral.light }}>
          <Box component="span" fontSize="1.2rem">+</Box>
        </IconButton>
        <Chip label="Hot" onClick={() => {}} sx={{ borderRadius: "0.5rem" }} />
        <Chip label="New" onClick={() => {}} sx={{ borderRadius: "0.5rem" }} />
        <Chip label="Top" onClick={() => {}} sx={{ borderRadius: "0.5rem" }} />
        <Chip label="Subject" onClick={() => {}} variant="outlined" sx={{ borderRadius: "0.5rem" }} />
        <Chip label="Category" onClick={() => {}} variant="outlined" sx={{ borderRadius: "0.5rem" }} />
      </Stack>
    </WidgetWrapper>
  );
};

export default MyPostWidget;
