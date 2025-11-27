const jwt = require("jsonwebtoken");
const user = require("../models/User");
const User = require("../models/User");

const verifyToken = (req, res, next) => {
  try {
    let token = req.header("Authorization");

    if (!token) {
      return res.status(403).send("Access Denied");
    }

    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trimLeft();
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const verifyAdmin = async(req,res,next)=>{
  try{
    const user = await User.findById(req.user.id);
    if(!user || !user.isAdmin){
      return res.status(403).json({msg:"Access denied.Admins Only"});
    }
    next();
  }catch(err){
    res.status(500).json({error:err.message});
  }
};

module.exports = { verifyToken,verifyAdmin };
