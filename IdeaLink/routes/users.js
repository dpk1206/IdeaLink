var express = require("express");
var router = express.Router();

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

// 테스트 aaa
router.get("/aaa", function (req, res, next) {
  res.render("aaa", { title: "Express" });
});

// db연결
const testController = require("../controllers/testcon");

router.get("/bbb", async function (req, res, next) {
  try {
    const result = await testController.selectTest();
    console.log("라우터 콘솔 ", result);
    res.render("aaa", { title: result });
  } catch (err) {
    console.error(err);
  }
});


module.exports = router;
