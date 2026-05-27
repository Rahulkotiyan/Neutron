const express = require("express");
const router = express.Router();
const toolsController = require("../controllers/toolsController");
const verifyToken = require("../middleware/authMiddleware");

router.get("/", toolsController.getAllTools);
router.get("/:slug", toolsController.getCategoryTools);
router.post("/category", verifyToken, toolsController.createCategory);
router.post("/subcategory", verifyToken, toolsController.createSubcategory);
router.post("/tool", verifyToken, toolsController.createTool);
router.delete("/tool/:id", verifyToken, toolsController.deleteTool);

module.exports = router;
