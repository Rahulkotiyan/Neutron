const express = require("express");
const router = express.Router();
const toolsController = require("../controllers/toolsController");
const verifyToken = require("../middleware/authMiddleware");
const { cacheMiddleware, clearOnSuccess } = require("../middleware/simpleCache");

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

router.get("/", optionalAuth, cacheMiddleware(120000), toolsController.getAllTools);
router.get("/:slug", optionalAuth, cacheMiddleware(120000), toolsController.getCategoryTools);
router.post("/category", verifyToken, clearOnSuccess('/api/tools/'), toolsController.createCategory);
router.post("/subcategory", verifyToken, clearOnSuccess('/api/tools/'), toolsController.createSubcategory);
router.post("/tool", verifyToken, clearOnSuccess('/api/tools/'), toolsController.createTool);
router.post("/tool/:id/star", verifyToken, clearOnSuccess('/api/tools/'), toolsController.toggleStar);
router.patch("/tool/:id", verifyToken, clearOnSuccess('/api/tools/'), toolsController.updateTool);
router.delete("/tool/:id", verifyToken, clearOnSuccess('/api/tools/'), toolsController.deleteTool);

module.exports = router;
