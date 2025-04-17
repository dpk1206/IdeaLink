document.addEventListener('DOMContentLoaded', () => {
  // 로그인 / 회원가입 오버레이 버튼 처리
  const signUpButton = document.getElementById('signUp');
  const signInButton = document.getElementById('signIn');
  const container = document.getElementById('container');

  signUpButton.addEventListener('click', () => {
    container.classList.add('right-panel-active');
  });

  signInButton.addEventListener('click', () => {
    container.classList.remove('right-panel-active');
  });

  // 사용자 유형 선택 시 폼 전환 처리
  const userTypeModal = document.getElementById('userTypeModal');
  const closeModal = document.getElementById('closeModal');
  const personalModalBtn = document.getElementById('personalModalBtn');
  const companyModalBtn = document.getElementById('companyModalBtn');
  const personalForm = document.querySelector('.personal-form');
  const companyForm = document.querySelector('.company-form');
  
  const emailSignupBtn = document.getElementById('emailSignupBtn');

  // 이메일로 가입하기 클릭 시 사용자 유형 모달 보이기
  emailSignupBtn.addEventListener('click', () => {
    userTypeModal.style.display = 'block'; // 모달 열기
    personalForm.style.display = 'none'; // 초기 상태에서 개인 폼 숨기기
    companyForm.style.display = 'none';  // 초기 상태에서 기업 폼 숨기기
  });

  // 모달 닫기 버튼 클릭 시
  closeModal.addEventListener('click', () => {
    userTypeModal.style.display = 'none'; // 모달 닫기
  });

  // 개인 선택 시 개인 폼 보이기
  personalModalBtn.addEventListener('click', () => {
    personalForm.style.display = 'block';
    companyForm.style.display = 'none';
    document.getElementById('user_type').value = 'individual';

  });

  // 기업 선택 시 기업 폼 보이기
  companyModalBtn.addEventListener('click', () => {
    companyForm.style.display = 'block';
    personalForm.style.display = 'none';
    document.getElementById('user_type').value = 'company';
    
  });

  // 사용자 유형에 따라 폼 전환 (기존 코드 중복 수정)
  const userTypeInputs = document.querySelectorAll('input[name="userType"]');
  const socialLoginBox = document.getElementById('socialLoginBox');
  
  function updateFormView() {
    const selected = document.querySelector('input[name="userType"]:checked')?.value;
    if (selected === 'company') {
      socialLoginBox.style.display = 'none'; // 사회적 로그인 숨기기
      personalForm.style.display = 'none'; // 개인 폼 숨기기
      companyForm.style.display = 'block'; // 기업 폼 보이기
    } else {
      socialLoginBox.style.display = 'block'; // 사회적 로그인 보이기
      personalForm.style.display = 'block'; // 개인 폼 보이기
      companyForm.style.display = 'none'; // 기업 폼 숨기기
    }
  }

  // 사용자 유형 선택시 폼 전환
  userTypeInputs.forEach(input => {
    input.addEventListener('change', updateFormView);
  });

  updateFormView(); // 초기 폼 전환

  // 📱 모바일 전용 버튼 처리
  const loginBtn = document.getElementById('mobileLoginBtn');
  const signupBtn = document.getElementById('mobileSignupBtn');
  const signInForm = document.getElementById('signInForm');
  const signUpFormContainer = document.getElementById('signUpForm');

  // 로그인 폼 보이기
  function showLoginForm() {
    signInForm.classList.add('mobile-show');
    signUpFormContainer.classList.remove('mobile-show');
    loginBtn.classList.add('active');
    signupBtn.classList.remove('active');
  }

  // 회원가입 폼 보이기
  function showSignupForm() {
    signInForm.classList.remove('mobile-show');
    signUpFormContainer.classList.add('mobile-show');
    loginBtn.classList.remove('active');
    signupBtn.classList.add('active');
  }

  loginBtn.addEventListener('click', showLoginForm);
  signupBtn.addEventListener('click', showSignupForm);

  // 화면 크기에 따라 로그인 폼 기본 표시
  if (window.innerWidth <= 768) {
    showLoginForm();
  }

  // ✅ 로그인 처리 (fetch로 로그인)
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
