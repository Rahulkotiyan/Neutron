const mongoose = require("mongoose");

// 1. USER SCHEMA
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String},
  googleId:{type:String},
  handle: { type: String },
  avatar: { type: String },
  department: { type: String },
  year: { type: String },
  followers:[{type:mongoose.Schema.Types.ObjectId,ref:"User"}],
  following:[{type:mongoose.Schema.Types.ObjectId,ref:"User"}],
  createdAt:{type:Date,default:Date.now},
});

// 2. POST SCHEMA
const PostSchema = new mongoose.Schema({
  title: { type: String },
  desc: { type: String },
  image: { type: String },
  tag: {
    type: String,
    enum: [
      "ANNOUNCEMENT",
      "MEME",
      "QUESTION",
      "LOST_FOUND",
      "OFFICIAL",
      "CONFESSION",
      "EVENT",
      "GENERAL",
    ],
  },
  author: {
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  },
  isAnonymous: { type: Boolean, default: false },
  stats: { type: String, default: "0" },
  createdAt: { type: Date, default: Date.now },
  college:{type:String,default:"Global"},
  likes:[{type:mongoose.Schema.Types.ObjectId,ref:"User"}],
  reposts:[{type:mongoose.Schema.Types.ObjectId,ref:"User"}],
  comments:[{
    user:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
    text:{type:String,required:true},
    createdAt:{type:Date,default:Date.now}
  }],
});

// 3. GROUP SCHEMA (For Discord Page)
const GroupSchema = new mongoose.Schema({
  name: String,
  icon: String,
  type: { type: String, enum: ["DEPT", "CLUB"] },
  channels: [{ name: String, type: { type: String, default: "text" } }],
  members:[{type:mongoose.Schema.Types.ObjectId,ref:"User"}],
});

// 4. MARKETPLACE LISTING (For Market Page)
const ListingSchema = new mongoose.Schema({
  title: String,
  price: String,
  desc: String,
  image: String,
  seller: { name: String, contact: String },
  category: { type: String, enum: ["BOOKS", "ELECTRONICS", "OTHER"] },
  createdAt: { type: Date, default: Date.now },
});

// 5. EVENT SCHEMA (For Right Sidebar)
const EventSchema = new mongoose.Schema({
  title: String,
  date: String,
  time: String,
  location: String,
  color: String,
});

// 6. RESOURCE SCHEMA
const ResourceSchema = new mongoose.Schema({
  title: String,
  subject: String,
  link: String,
  type: { type: String, enum: ["PDF", "LINK"] },
});

module.exports = {
  User: mongoose.model("User", UserSchema),
  Post: mongoose.model("Post", PostSchema),
  Group: mongoose.model("Group", GroupSchema),
  Listing: mongoose.model("Listing", ListingSchema),
  Event: mongoose.model("Event", EventSchema),
  Resource: mongoose.model("Resource", ResourceSchema),
};
