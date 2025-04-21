// ✅ 햄버거 메뉴 + 로그인 상태 체크
document.addEventListener('DOMContentLoaded', function () {
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.getElementById("nav-menu");
  const token = localStorage.getItem("token");

  // 햄버거 메뉴 토글
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', function () {
      navMenu.classList.toggle('dropdown-active');
    });

    document.addEventListener('click', function (e) {
      if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
        navMenu.classList.remove('dropdown-active');
      }
    });
  }

  // 로그인 상태 반영
  if (navMenu) {
    if (token) {
      try {
        const decoded = jwt_decode(token);
        console.log(decoded);
        const nickname = decoded.nick_name || decoded.email || "사용자";
        const user_id = decoded.user_id || null;

        navMenu.innerHTML = `
          <a href="/">메인</a>
          <a href="/ideas">아이디어</a>
          <a href="/notice">공지사항</a>
          <a href="/users/mypage?user_id=${user_id}">${nickname}님</a>
          <a href="#" id="logoutBtn">로그아웃</a>
        `;

        document.getElementById("logoutBtn").addEventListener("click", () => {
          localStorage.removeItem("token"); //토큰 삭제
          alert("로그아웃 되었습니다.");
          location.href="/";
        });

      } catch (err) {
        console.error("JWT 디코딩 오류:", err);
        localStorage.removeItem("token");
      }
    } else {
      navMenu.innerHTML = `
        <a href="/">메인</a>
        <a href="/ideas">아이디어</a>
        <a href="/notice">공지사항</a>
        <a href="/login_signup">로그인/회원가입</a>
      `;
    }
  }
});
