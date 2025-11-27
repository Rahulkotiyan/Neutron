const express = require("express");
const { getMarketItems } = require("../controllers/market.js");
const { verifyToken } = require("../middleware/auth.middleware.js");

const router = express.Router();

/* READ */
router.get("/", verifyToken, getMarketItems);

module.exports = router;
