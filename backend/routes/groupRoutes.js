const express = require("express");
const router = express.Router();
const groupController = require("../controllers/groupContoller");

router.get("/", groupController.getGroups);

module.exports = router;
