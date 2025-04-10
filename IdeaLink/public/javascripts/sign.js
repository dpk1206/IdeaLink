const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

// 🔁 UI 전환 (오버레이 버튼)
signUpButton.addEventListener('click', () => {
  container.classList.add('right-panel-active');
});
signInButton.addEventListener('click', () => {
  container.classList.remove('right-panel-active');
});

// 👤 사용자 유형에 따라 폼 전환
const userTypeInputs = document.querySelectorAll('input[name="userType"]');
const socialLoginBox = document.getElementById('socialLoginBox');
const personalForm = document.querySelector('.personal-form');
const companyForm = document.querySelector('.company-form');

function updateFormView() {
  const selected = document.querySelector('input[name="userType"]:checked').value;
  if (selected === 'company') {
    socialLoginBox.style.display = 'none';
    personalForm.style.display = 'none';
    companyForm.style.display = 'block';
  } else {
    socialLoginBox.style.display = 'block';
    personalForm.style.display = 'block';
    companyForm.style.display = 'none';
  }
}

userTypeInputs.forEach(input => {
  input.addEventListener('change', updateFormView);
});

// 📱 모바일 전용 버튼 처리
document.addEventListener('DOMContentLoaded', () => {
  updateFormView();

  const loginBtn = document.getElementById('mobileLoginBtn');
  const signupBtn = document.getElementById('mobileSignupBtn');
  const signInForm = document.getElementById('signInForm');
  const signUpFormContainer = document.getElementById('signUpForm');

  function showLoginForm() {
    signInForm.classList.add('mobile-show');
    signUpFormContainer.classList.remove('mobile-show');
    loginBtn.classList.add('active');
    signupBtn.classList.remove('active');
  }

  function showSignupForm() {
    signInForm.classList.remove('mobile-show');
    signUpFormContainer.classList.add('mobile-show');
    loginBtn.classList.remove('active');
    signupBtn.classList.add('active');
  }

  loginBtn.addEventListener('click', showLoginForm);
  signupBtn.addEventListener('click', showSignupForm);

  if (window.innerWidth <= 768) {
    showLoginForm();
  }

  // ✅ ✅ 로그인 버튼 클릭 시 fetch로 로그인 처리
  const loginSubmitBtn = signInForm.querySelector('button[type="submit"]');
  loginSubmitBtn.type = "button"; // 기본 form 제출 막기

  loginSubmitBtn.addEventListener("click", async () => {
    const email = signInForm.querySelector('input[name="email"]').value;
    const password = signInForm.querySelector('input[name="password"]').value;

    try {
      const res = await fetch("/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("token", data.token); // 토큰 저장
        alert("로그인 성공!");
        window.location.href = "/"; // 로그인 성공 후 홈으로
      } else {
        alert(data.message || "로그인 실패");
      }
    } catch (err) {
      console.error("로그인 오류:", err);
      alert("서버 오류가 발생했습니다.");
    }
  });
});
