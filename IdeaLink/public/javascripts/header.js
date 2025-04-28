// 모바일 메뉴 열기/닫기
window.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.querySelector(".nav-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");
  const closeBtn = document.querySelector(".close-menu");

  if (toggleBtn && mobileMenu && closeBtn) {
    toggleBtn.addEventListener("click", () => {
      mobileMenu.classList.add("active");
    });

    closeBtn.addEventListener("click", () => {
      mobileMenu.classList.remove("active");
    });

    // 바깥 영역 클릭 시 닫기 (선택 사항)
    mobileMenu.addEventListener("click", (e) => {
      if (e.target === mobileMenu) {
        mobileMenu.classList.remove("active");
      }
    });
  }

  // pc 헤더 로그인 상태 반영
  const desktopNavMenu = document.querySelector(".nav-menu-desktop");
  const token = localStorage.getItem("token");
  console.log("메뉴", desktopNavMenu);
  if (desktopNavMenu) {
    if (token) {
      try {
        const decoded = jwt_decode(token);
        console.log(decoded);
        const nickname = decoded.nick_name || decoded.email || "사용자";
        const user_id = decoded.user_id || null;

        desktopNavMenu.innerHTML = `
          <a href="/ideas">아이디어 게시판</a>
          <a href="#">공모전/전시</a>
          <a href="/notice">공지사항</a>
          <a href="/faq">FAQ&건의</a>
          <a href="/users/mypage?user_id=${user_id}">☻ ${nickname}님</a>
          <a href="#" id="logoutBtn">로그아웃</a>
        `;

        document.getElementById("logoutBtn").addEventListener("click", () => {
          localStorage.removeItem("token"); //토큰 삭제
          alert("로그아웃 되었습니다.");
          location.href = "/";
        });
      } catch (err) {
        console.error("JWT 디코딩 오류:", err);
        localStorage.removeItem("token");
      }
    } else {
      desktopNavMenu.innerHTML = `
        <a href="/ideas">아이디어 게시판</a>
        <a href="#">공모전/전시</a>
        <a href="/notice">공지사항</a>
        <a href="/faq">FAQ&건의</a>
        <a href="/login_signup">로그인/회원가입</a>
      `;
    }
  }
  // 모바일 헤더 로그인 상태 반영
  const mobileNavMenu = document.querySelector(".mobile-nav");
  console.log("메뉴", mobileNavMenu);
  if (mobileNavMenu) {
    if (token) {
      try {
        const decoded = jwt_decode(token);
        console.log(decoded);
        const nickname = decoded.nick_name || decoded.email || "사용자";
        const user_id = decoded.user_id || null;

        mobileNavMenu.innerHTML = `
          <a href="/ideas">아이디어 게시판</a>
          <a href="#">공모전/전시</a>
          <a href="/notice">공지사항</a>
          <a href="/faq">FAQ&건의</a>
          <a href="/users/mypage?user_id=${user_id}">☻ ${nickname}님</a>
          <a href="#" id="logoutBtn">로그아웃</a>
        `;

        document.getElementById("logoutBtn").addEventListener("click", () => {
          localStorage.removeItem("token"); //토큰 삭제
          alert("로그아웃 되었습니다.");
          location.href = "/";
        });
      } catch (err) {
        console.error("JWT 디코딩 오류:", err);
        localStorage.removeItem("token");
      }
    } else {
      mobileNavMenu.innerHTML = `
        <a href="/ideas">아이디어 게시판</a>
        <a href="#">공모전/전시</a>
        <a href="/notice">공지사항</a>
        <a href="/faq">FAQ&건의</a>
        <a href="/login_signup">로그인/회원가입</a>
      `;
    }
  }
});
