const jwt = require("jsonwebtoken");

// Create a server/middleware folder for this file

// This middleware function checks for a valid token
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]; // Get token from header

  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }

  try {
    // The token might be "Bearer <token>", so we split and get the token part
    const actualToken = token.split(" ")[1];
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
    req.user = decoded; // Add user payload to the request object
  } catch (err) {
    return res.status(401).send("Invalid Token");
  }
  return next(); // Continue to the next function (the route handler)
};

module.exports = verifyToken;
