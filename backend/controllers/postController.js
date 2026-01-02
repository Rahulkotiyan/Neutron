const { Post,User } = require("../models/Schema");

exports.getPosts = async (req, res) => {
  try {
    const { tag } = req.query;
    const filter = tag ? { tag } : {};
    const posts = await Post.find(filter).populate("author","name handle avatar").populate("comments.user","name handle avatar").sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching posts" });
  }
};

exports.createPost = async (req, res) => {
  try {
    const {title,desc,tag}=req.body;

    if(!req.user||!req.user.email){
      console.log("❌ Error: req.user is undefined. Middleware did not run.");
      return res.status(401).json({message:"Unauthorized:User not identified"});
    }

    const user = await User.findOne({email:req.user.email});

    if(!user){
      return res.status(404).json({message:"User not found"});
    }

    const newPost = await Post.create({
      title,
      desc,
      tag:tag||"GENERAL",
      author:user._id,
      createdAt:new Date()
    });
    const populatedPost = await Post.findById(newPost._id).populate("author","name handle avatar");
    res.status(201).json(populatedPost);
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
};

//Toggle Like
exports.likePost = async(req,res)=>{
  try{
    const {id}=req.params;
    const user=await User.findOne({email:req.user.email});
    const post=await Post.findById(id);

    if(!post)
      return res.status(404).json({message:"Post not found"});

    const isLiked = post.likes.includes(user._id);

    if(isLiked){
      post.likes.pull(user._id);
    }else{
      post.likes.push(user._id);
    }
    await post.save();
    res.json(post.likes);
  }catch(e){
    res.status(500).json({message:e.message});
  }
};

// Add Comment
exports.commentPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const user = await User.findOne({ email: req.user.email });
    
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const newComment = {
      user: user._id,
      text,
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();

    // Re-fetch to populate the new comment author
    const updatedPost = await Post.findById(id).populate("comments.user", "name handle avatar");
    res.json(updatedPost.comments);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Repost (Simple counter/tracker implementation)
exports.repostPost = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ email: req.user.email });
    const post = await Post.findById(id);

    if (post.reposts.includes(user._id)) {
       return res.status(400).json({ message: "Already reposted" });
    }

    post.reposts.push(user._id);
    await post.save();
    res.json(post.reposts);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};