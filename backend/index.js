
//imports

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Post = require('./models/Post');

//express
const app = express();

//cors for binding frontend and backend
app.use(cors());
app.use(express.json());

//creating connection for mongoDB
mongoose.connect(process.env.MONGO_URI).then(()=>console.log("MongoDB connected successfully")).catch(err=>console.error("MongoDB connection error:",err));

//API routes

app.get('/api/posts',async(req,res)=>{
    try{
        const mockData=[
        {
        id: 1,
        author: { name: "Vex onwe loe", handle: "@logriinht", avatar: "https://i.pravatar.cc/150?img=11" },
        tag: "ANNOUNCEMENT",
        tagColor: "bg-blue-100 text-blue-600",
        title: "Guest Lecture: AI in Healthcare - Tomorrow!",
        desc: "Ancle tonnt toms sexecarlav and tarasieret. Exomy itomi kilesg tinort the time.",
        stats: "4.5K"
      },
      {
        id: 2,
        author: { name: "Hyn santvirat", handle: "tep-to Ilot", avatar: "https://i.pravatar.cc/150?img=5" },
        tag: "MEME",
        tagColor: "bg-green-100 text-green-600",
        title: "Foat tarfor AI, Ncelficas",
        desc: "aowroitaw: lait hootitont ciantais.",
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", 
        stats: "4.5K"
      },
      {
        id: 3,
        author: { name: "Abx sw sxre", handle: "erliod", avatar: "https://i.pravatar.cc/150?img=3" },
        tag: "QUESTION",
        tagColor: "bg-yellow-100 text-yellow-600",
        title: "Best cafes near campus studying?",
        desc: "Uceny diot corsrlir rititert.",
        stats: "4.5K"
      },
      {
        id: 4,
        author: { name: "Lav ollene", handle: "stteir lo ywat", avatar: "https://i.pravatar.cc/150?img=9" },
        tag: "QUESTION",
        tagColor: "bg-yellow-100 text-yellow-600",
        title: "Best cafes near studying?",
        desc: "Lav ollene stteir lo ywat eaoits.",
        stats: "4.5K"
      }
        ];
        res.json(mockData);
    }catch(err){
        res.status(500).json({message:err.message});
    }
});

app.listen(process.env.PORT,()=>{
    console.log(`Server running on port ${process.env.PORT}`);
});