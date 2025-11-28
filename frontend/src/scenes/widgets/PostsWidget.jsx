import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "state";
import PostWidget from "./PostWidget";

const PostsWidget = ({ userId, isProfile = false, feedSort = "new", feedCategory = "all" }) => {
  const dispatch = useDispatch();
  const posts = useSelector((state) => state.posts);
  const token = useSelector((state) => state.token);

  const getPosts = async () => {
    const response = await fetch(
      `http://localhost:5000/api/posts?sort=${feedSort}&category=${feedCategory}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await response.json();
    dispatch(setPosts({ posts: data }));
  };

  const getUserPosts = async () => {
    const response = await fetch(
      `http://localhost:5000/api/posts/${userId}/posts`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await response.json();
    dispatch(setPosts({ posts: data }));
  };

  useEffect(() => {
    if (isProfile) {
      getUserPosts();
    } else {
      getPosts();
    }
  }, [userId, isProfile, feedSort, feedCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!posts || !Array.isArray(posts)) return null;

  return (
    <>
      {posts.map(
        ({ _id, userId, username, content, image, likes, comments, dislikes, upvoteCount, type, userPicturePath }) => (
          <PostWidget
            key={_id}
            postId={_id}
            postUserId={userId._id || userId} // Handle population differences
            name={userId.username || username} // Fallback if population fails
            description={content}
            location="Main Campus"
            picturePath={image}
            userPicturePath={userPicturePath}
            likes={likes}
            dislikes={dislikes} // New
            comments={comments}
            upvoteCount={upvoteCount} // New
            type={type} // New
          />
        )
      )}
    </>
  );
};

export default PostsWidget;
