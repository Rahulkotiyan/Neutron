const admin = require("../config/firebase");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Check if token exists
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // 2. Verify token with Firebase
    const decodedToken = await admin.auth().verifyIdToken(token);

    // 3. Attach user info to request object
    req.user = decodedToken;

    // 4. Continue to the controller
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    res.status(403).json({ error: "Unauthorized: Invalid token" });
  }
};

module.exports = verifyToken;
