const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    handle:{type:String},
    avatar:{type:String,default:"https://api.dicebear.com/7.x/avataaara/svg?seed=Felix"},
    joinedAt:{type:Date,default:Date.now}
});

module.exports=mongoose.model('User',UserSchema);