const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const verifyToken = require("../middleware/authMiddleware");

router.get("/", postController.getPosts);

router.post("/",verifyToken, postController.createPost);
router.put("/:id/like",verifyToken,postController.likePost);
router.post("/:id/comment",verifyToken,postController.commentPost);
router.post("/:id/repost",verifyToken,postController.repostPost);


module.exports = router;
