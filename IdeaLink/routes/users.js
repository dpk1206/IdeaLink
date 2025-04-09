var express = require("express");
var router = express.Router();
const testController = require("../controllers/testcon"); // 컨트롤러 연결

// ✅ 회원가입 라우터
router.post("/register", async function (req, res, next) {
  try {
    console.log("회원가입 데이터:", req.body);

    // 컨트롤러에 전체 req, res 전달
    await testController.registerUser(req, res);
  } catch (err) {
    console.error("회원가입 중 오류:", err);
    res.status(500).send("회원가입 실패");
  }
});

// ✅ 로그인 라우터
router.post("/login", async function (req, res, next) {
  try {
    console.log("로그인 시도:", req.body.email);

    await testController.loginUser(req, res);
  } catch (err) {
    console.error("로그인 중 오류:", err);
    res.status(500).send("로그인 실패");
  }
});

// 기타 테스트 라우트
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

router.get("/aaa", function (req, res, next) {
  res.render("aaa", { title: "Express" });
});

router.get("/bbb", async function (req, res, next) {
  await testController.selectTest(req, res);
});

module.exports = router;
