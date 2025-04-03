const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

signUpButton.addEventListener('click', () => {
  container.classList.add('right-panel-active');
});

signInButton.addEventListener('click', () => {
  container.classList.remove('right-panel-active');
});

// 사용자 유형에 따라 폼 및 소셜로그인 표시
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

document.addEventListener('DOMContentLoaded', () => {
  updateFormView();

  // 모바일 전용 버튼 동작
  const loginBtn = document.getElementById('mobileLoginBtn');
  const signupBtn = document.getElementById('mobileSignupBtn');
  const signInForm = document.getElementById('signInForm');
  const signUpForm = document.getElementById('signUpForm');

  function showLoginForm() {
    signInForm.classList.add('mobile-show');
    signUpForm.classList.remove('mobile-show');
    loginBtn.classList.add('active');
    signupBtn.classList.remove('active');
  }

  function showSignupForm() {
    signInForm.classList.remove('mobile-show');
    signUpForm.classList.add('mobile-show');
    loginBtn.classList.remove('active');
    signupBtn.classList.add('active');
  }

  loginBtn.addEventListener('click', showLoginForm);
  signupBtn.addEventListener('click', showSignupForm);

  // 처음 페이지 진입 시 로그인 폼 보이게
  if (window.innerWidth <= 768) {
    showLoginForm();
  }
});