
document.addEventListener("DOMContentLoaded", function () {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const sections = document.querySelectorAll(".mypage-section");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-tab");

      // 탭 버튼 UI
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // 섹션 전환
      sections.forEach((sec) => {
        sec.style.display = sec.id === targetId ? "block" : "none";
      });
    });
  });

  // 사용자 유형에 따라 폼 보이기 (더미 조건 사용)
  const isCompany = false; // true면 기업회원

  const personalForm = document.getElementById("personalForm");
  const companyForm = document.getElementById("companyForm");

  if (isCompany) {
    companyForm.style.display = "block";
  } else {
    personalForm.style.display = "block";
  }

  // 유저 이름 중복 확인 버튼
  const checkBtn = document.getElementById("checkUsername");
  if (checkBtn) {
    checkBtn.addEventListener("click", () => {
      alert("사용 가능한 유저이름입니다.");
    });
  }
});
