var express = require("express");
var router = express.Router();
const userController = require("../controllers/authController");

// ✅ 회원가입 라우터
router.post("/register", async function (req, res, next) {
  try {
    console.log("회원가입 데이터:", req.body);
    await userController.registerUser(req, res); 
  } catch (err) {
    console.error("회원가입 중 오류:", err);
    res.status(500).send("회원가입 실패");
  }
});

// ✅ 로그인 라우터
router.post("/login", async function (req, res, next) {
  try {
    console.log("로그인 시도:", req.body.email);
    await userController.loginUser(req, res); 
  } catch (err) {
    console.error("로그인 중 오류:", err);
    res.status(500).send("로그인 실패");
  }
});

// 테스트 라우트들
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

router.get("/aaa", function (req, res, next) {
  res.render("aaa", { title: "Express" });
});

router.get("/bbb", async function (req, res, next) {
  await userController.selectTest(req, res); 
});

module.exports = router;
