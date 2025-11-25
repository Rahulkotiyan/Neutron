const router = require("express").Router();

router.get("/", (req, res) => {
  res.send("Market Route is working");
});

module.exports = router;
