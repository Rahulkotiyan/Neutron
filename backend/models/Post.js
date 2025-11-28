//Data model for posts

const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    id:Number,
    author:{
        name:String,
        avatar:String,
        handle:String
    },
    tag:String,
    tagColor:String,
    title:String,
    desc:String,
    image:String,
    stats:String
});

module.exports = mongoose.model('Post',PostSchema);