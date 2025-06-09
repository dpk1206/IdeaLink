window.addEventListener("DOMContentLoaded", () => {

  if (user_id) {
    // 헤더 알림용 소켓 연결
    const notificationSocket = io('/notification', {
      auth: { user_id: user_id },
      autoConnect: true  // 필요시 수동 연결
    });

    // 알림 이벤트 수신
    notificationSocket.on('notification', (data) => {
      // class가 "notification"인 모든 요소를 찾아서
      const badgeElements = document.querySelectorAll('.notification');
      badgeElements.forEach(el => {
        // 안읽은 알림이 0이면 빈 문자열, 1 이상이면 숫자 표시
        el.textContent = data.count > 0 ? "•"+data.count : '';
        // (옵션) 빨간 점 스타일 추가
        if (count > 0) {
          el.style.color = 'red';
          el.style.fontSize = 'smaller';
          el.style.position = 'relative';
          el.style.top = '-5px';
        } else {
          el.style.color = '';
          el.style.fontSize = '';
          el.style.position = '';
          el.style.top = '';
        }
      });

    });
  } else {
    console.warn('user_id가 없어 소켓 연결을 하지 않습니다.');
  }

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

});
