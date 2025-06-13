const express = require("express");
const router = express.Router();
const adminMiddleware = require("../middleware/adminMiddleware");

router.use(adminMiddleware);

router.get("/dashboard", (req, res) => {
  res.render("admin.ejs");
});

module.exports = router;
