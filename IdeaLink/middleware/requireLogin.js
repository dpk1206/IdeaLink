module.exports = (req, res, next) => {
  if (!req.user) {
    // 로그인 안 된 경우 → 경고창 띄우고 로그인 페이지로 이동
    return res.send(`
      <script>
        alert("로그인이 필요합니다.");
        window.location.href = "/login_signup";
      </script>
    `);
  }
  next(); // 로그인 된 경우 → 다음 미들웨어 or 컨트롤러로 진행
};