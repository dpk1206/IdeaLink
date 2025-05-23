const express = require("express");
const router = express.Router();
const userController = require("../controllers/authController");
const kakaoController = require("../controllers/kakaoAuthController");
const naverController = require("../controllers/naverAuthController");
const requireLogin = require("../middleware/requireLogin");
const userCont = require("../controllers/userController");

// 마이페이지 - 일단 그냥 연결 추후 접근제한 필요
router.get('/mypage', requireLogin, userCont.mypage);

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
    next(err); // 에러시 에러핸들러 일괄처리
  }
});

// 카카오 로그인 콜백 라우터
router.get("/kakao/callback", async (req, res, next) => {
  try {
    await kakaoController.kakaoCallback(req, res, next);
  } catch (err) {
    console.error("카카오 로그인 콜백 오류:", err);
    next(err); // 에러시 에러핸들러 일괄처리
  }
});

// 네이버 로그인 콜백 라우터
router.get("/naver/callback", async (req, res, next) => {
  try {
    console.log("네이버 로그인 콜백에 도달:", req.query.code); // code 파라미터 확인
    await naverController.naverCallback(req, res, next);
  } catch (err) {
    console.error("네이버 로그인 콜백 오류:", err);
    next(err); // 에러시 에러핸들러 일괄처리
  }
});

// ✅ 토큰 인증된 사용자만 접근 가능한 예시 라우터 (보호 라우트)
router.get("/profile", requireLogin, (req, res) => {
  res.json({
    message: "프로필 조회 성공!",
    user: req.user, // 토큰에서 복호화된 사용자 정보
  });
});

// 로그아웃
router.get("/logout", (req, res) => {
  res.clearCookie("token"); // 쿠키 삭제
  res.redirect("/"); // 로그인 페이지로 리디렉션
});
module.exports = router;
