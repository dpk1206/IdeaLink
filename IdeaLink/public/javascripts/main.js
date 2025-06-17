document.addEventListener("DOMContentLoaded", function () {
  // 1. 모바일 메뉴 열고 닫기
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

  // 2. FAQ 아코디언
  const accordionTitles = document.querySelectorAll(".accordion-title");

  accordionTitles.forEach(title => {
    title.addEventListener("click", () => {
      const item = title.parentElement;

      if (item.classList.contains("active")) {
        item.classList.remove("active");
      } else {
        document.querySelectorAll(".accordion-item").forEach(i => i.classList.remove("active"));
        item.classList.add("active");
      }
    });
  });

  // 3. 탭 기능 (현재 사용되지 않음, 주석 처리)
  /*
  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".tab-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-target");

      tabs.forEach((t) => t.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));

      tab.classList.add("active");
      document.querySelector(target).classList.add("active");
    });
  });
  */

  // 4. PC에서만 Full Page Scroll
  if (window.innerWidth >= 1024) {
    const sections = document.querySelectorAll(".section");
    let currentIndex = 0;
    let isScrolling = false;

    const scrollToSection = (index) => {
      if (index >= 0 && index < sections.length) {
        sections[index].scrollIntoView({ behavior: "smooth" });
      }
    };

    window.addEventListener("wheel", (e) => {
      if (isScrolling) return;
      isScrolling = true;

      if (e.deltaY > 0) {
        currentIndex = Math.min(currentIndex + 1, sections.length - 1);
      } else {
        currentIndex = Math.max(currentIndex - 1, 0);
      }

      scrollToSection(currentIndex);

      setTimeout(() => {
        isScrolling = false;
      }, 1000); // 1초간 스크롤 잠금
    });
  }

  // 5. (사용하지 않는 경우 제거 가능) 헤더/푸터 fetch
  /*
  fetch("header.html")
    .then(res => res.text())
    .then(data => {
      document.getElementById("include-header").innerHTML = data;
    });

  fetch("footer.html")
    .then(res => res.text())
    .then(data => {
      document.getElementById("include-footer").innerHTML = data;
    });
  */
});
