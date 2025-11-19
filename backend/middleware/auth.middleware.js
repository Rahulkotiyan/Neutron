// server/middleware/auth.middleware.js
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  console.log("VerifyToken Middleware - Auth Header:", authHeader); // Debugging

  if (!authHeader) {
    console.log("VerifyToken Middleware - No Authorization header provided.");
    return res.status(401).json("No authorization header provided.");
  }

  const token = authHeader.split(" ")[1]; // Expecting "Bearer TOKEN"

  if (!token) {
    console.log("VerifyToken Middleware - Token missing after split.");
    return res.status(401).json("Token missing.");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log(
      "VerifyToken Middleware - Token decoded, user:",
      req.user.userId
    ); // Debugging
    next();
  } catch (err) {
    console.error(
      "VerifyToken Middleware - JWT Verification Failed:",
      err.message
    ); // Detailed error
    return res.status(401).json("Invalid token.");
  }
};

module.exports = verifyToken;
