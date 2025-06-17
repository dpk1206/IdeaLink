const express = require("express");
const router = express.Router();
const adminMiddleware = require("../middleware/adminMiddleware");
const adminController = require('../controllers/adminController');


router.use(adminMiddleware);

router.get("/dashboard", (req, res) => {
  res.render("admin.ejs");
});

router.get('/point-logs', adminController.getAllPointLogs);
router.get('/posts', adminController.getAllPostsWithAnswers);
module.exports = router;
