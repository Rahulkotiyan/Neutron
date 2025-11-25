const router = require("express").Router();

router.get("/", (req, res) => {
  res.send("Resources Route is working");
});

module.exports = router;
