const express = require("express");
const router = express.Router();
const userController = require("../controllers/authController");
const kakaoController = require("../controllers/kakaoAuthController");
const naverController = require("../controllers/naverAuthController");
const requireLogin = require("../middleware/requireLogin");
const mypageController = require("../controllers/mypageController");
const bookmarkController = require("../controllers/bookmarkController");
const notificationModel = require("../models/notificationModel");

// 마이페이지
router.get('/mypage', requireLogin, mypageController.renderMypage);


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

// TODO: 북마크 비동기 요청 라우터 추가
router.post("/bookmark", bookmarkController.addBookmark);
router.delete("/bookmark", bookmarkController.removeBookmark);

router.post("/notification/read", async (req, res, next) => {
  try {
    const result = await notificationModel.markAsRead(req.body.notification_id, req.body.type, req.user.user_id);
    // markAsRead가 성공하면 result로 처리 결과를 받는다고 가정
    res.status(200).json({
      success: true,
      message: "알림 읽음 처리 완료"
    });
  } catch (err) {
    console.error("오류:", err);
    next(err); // 에러시 에러핸들러 일괄처리
  }
});



module.exports = router;