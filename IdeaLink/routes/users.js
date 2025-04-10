const express = require("express");
const router = express.Router();
const userController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware"); // 토큰 인증 미들웨어

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

// 토큰 인증된 사용자만 접근 가능한 라우터 예시 (보호 라우트)
router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "프로필 조회 성공!",
    user: req.user, // 토큰에서 복호화된 사용자 정보
  });
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
