const express = require("express");
const router = express.Router();
const toolsController = require("../controllers/toolsController");
const verifyToken = require("../middleware/authMiddleware");

const jwt = require("jsonwebtoken");
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return next();
  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    if (decoded) req.user = { _id: decoded._id || decoded.sub };
  } catch { /* token invalid or expired — proceed without auth */ }
  next();
};

router.get("/", optionalAuth, toolsController.getAllTools);
router.get("/:slug", optionalAuth, toolsController.getCategoryTools);
router.post("/category", verifyToken, toolsController.createCategory);
router.post("/subcategory", verifyToken, toolsController.createSubcategory);
router.post("/tool", verifyToken, toolsController.createTool);
router.post("/tool/:id/star", verifyToken, toolsController.toggleStar);
router.delete("/tool/:id", verifyToken, toolsController.deleteTool);

module.exports = router;
