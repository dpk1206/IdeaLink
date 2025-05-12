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

    mobileMenu.addEventListener("click", (e) => {
      if (e.target === mobileMenu) {
        mobileMenu.classList.remove("active");
      }
    });
  }

  const token = localStorage.getItem("token");

  async function renderNavMenu(menuElement) {
    if (!menuElement) return;

    if (token) {
      try {
        const decoded = await jwtVerify(token);
        console.log("Decoded JWT:", decoded);
        const nickname = decoded.nick_name || decoded.email || "사용자";
        const user_id = decoded.user_id || null;

        // 전역에 사용자 정보 저장
        window.currentUser = { user_id };

        menuElement.innerHTML = `
          <a href="/ideas">아이디어 게시판</a>
          <a href="#">공모전/전시</a>
          <a href="/notice">공지사항</a>
          <a href="/faq">FAQ&건의</a>
          <a href="/users/mypage?user_id=${user_id}">☻ ${nickname}님</a>
          <a href="#" id="logoutBtn">로그아웃</a>
        `;

        menuElement.querySelector("#logoutBtn").addEventListener("click", () => {
          localStorage.removeItem("token");
          alert("로그아웃 되었습니다.");
          location.href = "/";
        });

      } catch (err) {
        console.error("JWT 디코딩 오류:", err);
        localStorage.removeItem("token");
      }
    } else {
      menuElement.innerHTML = `
        <a href="/ideas">아이디어 게시판</a>
        <a href="#">공모전/전시</a>
        <a href="/notice">공지사항</a>
        <a href="/faq">FAQ&건의</a>
        <a href="/login_signup">로그인/회원가입</a>
      `;
    }
  }

  // ✅ 비동기 즉시 실행 함수로 순서 보장
  (async () => {
    await renderNavMenu(document.querySelector(".nav-menu-desktop")); // PC
    await renderNavMenu(document.querySelector(".mobile-nav"));       // Mobile

    if (window.currentUser?.user_id) {
      window.dispatchEvent(new CustomEvent("userReady", {
        detail: {
          user_id: window.currentUser.user_id,
        },
      }));
    }
  })();
});

// JWT 토큰 검증 함수
async function jwtVerify(token) {
  try {
    const res = await fetch("/users/verify", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      alert("세션이 만료되었습니다. 다시 로그인 해주세요.");
      location.href = "/login_signup";
      throw new Error("Unauthorized");
    }

    return await res.json();
  } catch (err) {
    console.error("서버 오류 발생:", err);
    alert("서버 오류가 발생했습니다.");
    throw err;
  }
}
