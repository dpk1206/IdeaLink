window.addEventListener("DOMContentLoaded", () => {

  if (user_id) {
    // 헤더 알림용 소켓 연결
    const notificationSocket = io('/notification', {
      auth: { user_id: user_id },
      autoConnect: true  // 필요시 수동 연결
    });

    // 알림 이벤트 수신
    notificationSocket.on('notification', (data) => {
      updateNotificationBadge(data.count);
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
