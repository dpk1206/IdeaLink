// 개인
let emailInput, pwInput, pwCheckInput, nameInput, nicknameInput, phoneInput;

// 기업
let companyNameInput,
  companyRegNoInput,
  companyPhoneInput,
  companyAddressInput,
  companyWebsiteInput,
  companyEmailInput,
  companyPwInput,
  companyPwCheckInput;

let signupInputs;
let signupSubmitBtn;
let selectedType = ""; // 개인 or 기업 선택 저장
let loginType = document.getElementById("user_type");

// 로그인/회원가입 화면 전환
const signUpButton = document.getElementById("signUp");
const loginButton = document.getElementById("login");
const container = document.getElementById("container");

signUpButton.addEventListener("click", () => {
  container.classList.add("right-panel-active");
});

loginButton.addEventListener("click", () => {
  container.classList.remove("right-panel-active");
});

// 사용자 유형 전환
const userTypeInputs = document.querySelectorAll('input[name="userType"]');
const socialLoginBox = document.getElementById("socialLoginBox");
const personalForm = document.querySelector(".personal-form");
const companyForm = document.querySelector(".company-form");
const companySignupFormPage = document.getElementById("companySignupFormPage");

function updateFormView() {
  const checkedInput = document.querySelector('input[name="userType"]:checked');

  if (!checkedInput) return; // 체크된거 없으면 함수 종료

  const selected = checkedInput.value;

  if (selected === "company") {
    socialLoginBox.style.display = "none";
    personalForm.style.display = "none";
    companyForm.style.display = "block";
  } else {
    socialLoginBox.style.display = "block";
    personalForm.style.display = "block";
    companyForm.style.display = "none";
  }
}

userTypeInputs.forEach((input) => {
  input.addEventListener("change", updateFormView);
});

document.addEventListener("DOMContentLoaded", () => {
  updateFormView();

  signupFormPage.style.display = "none"; // 개인폼 숨김
  companySignupFormPage.style.display = "none"; // 기업폼 숨김

  const loginBtn = document.getElementById("mobileLoginBtn");
  const signupBtn = document.getElementById("mobileSignupBtn");
  const loginForm = document.getElementById("loginForm");
  const signUpForm = document.getElementById("signUpForm");

  function showLoginForm() {
    loginForm.classList.add("mobile-show");
    signUpForm.classList.remove("mobile-show");
    loginBtn.classList.add("active");
    signupBtn.classList.remove("active");
  }

  function showSignupForm() {
    loginForm.classList.remove("mobile-show");
    signUpForm.classList.add("mobile-show");
    loginBtn.classList.remove("active");
    signupBtn.classList.add("active");
  }

  loginBtn.addEventListener("click", showLoginForm);
  signupBtn.addEventListener("click", showSignupForm);

  if (window.innerWidth <= 768) {
    showLoginForm();
  }
});

const normalLoginToggle = document.getElementById("normalLoginToggle");
const normalLoginBox = document.getElementById("normalLoginBox");

const personalLoginBtn = document.getElementById("personalLoginBtn");
const companyLoginBtn = document.getElementById("companyLoginBtn");

// 일반 로그인 개인, 기업 토글 버튼 액티브, 폼 처리
normalLoginToggle.addEventListener("click", () => {
  if (normalLoginBox.style.display === "none") {
    normalLoginBox.style.display = "block";
    normalLoginToggle.classList.add("active");
  } else {
    normalLoginBox.style.display = "none";
    normalLoginToggle.classList.remove("active");
  }
});

// 일반 로그인 개인, 기업 토글 버튼 hidden value
personalLoginBtn.addEventListener("click", () => {
  loginType.value = "individual";
  personalLoginBtn.classList.add("active");
  companyLoginBtn.classList.remove("active");
});
companyLoginBtn.addEventListener("click", () => {
  loginType.value = "company";
  companyLoginBtn.classList.add("active");
  personalLoginBtn.classList.remove("active");
});

// Modal 관련
const emailSignupBtn = document.getElementById("emailSignupBtn");
const signupModal = document.getElementById("signupModal");
const modalOverlay = document.getElementById("modalOverlay");
const closeModal = document.getElementById("closeModal");
const closeModal2 = document.getElementById("closeModal2");

const nextToForm = document.getElementById("nextToForm");
const termsPage = document.getElementById("termsPage");
const signupFormPage = document.getElementById("signupFormPage");
const termsAll = document.getElementById("termsAll");
const termsChecks = document.querySelectorAll("#termsPage .terms");

closeModal.addEventListener("click", closeModalFunc);
closeModal2.addEventListener("click", closeModalFunc);
modalOverlay.addEventListener("click", closeModalFunc);

function closeModalFunc() {
  signupModal.style.display = "none";
  modalOverlay.style.display = "none";
  termsPage.style.display = "block";
  signupFormPage.style.display = "none";
  companySignupFormPage.style.display = "none";
}

const signupSelectModal = document.getElementById("signupSelectModal");
const closeSelectModal = document.getElementById("closeSelectModal");
const selectPersonalBtn = document.getElementById("selectPersonalBtn");
const selectCompanyBtn = document.getElementById("selectCompanyBtn");

emailSignupBtn.addEventListener("click", () => {
  signupSelectModal.style.display = "block";
  modalOverlay.style.display = "block";
});

closeSelectModal.addEventListener("click", () => {
  signupSelectModal.style.display = "none";
  modalOverlay.style.display = "none";
});

selectPersonalBtn.addEventListener("click", () => {
  signupSelectModal.style.display = "none";
  signupModal.style.display = "block";
});

selectCompanyBtn.addEventListener("click", () => {
  signupSelectModal.style.display = "none";
  signupModal.style.display = "block";
});

// 전체 동의 처리
termsAll.addEventListener("change", () => {
  const checkStatus = termsAll.checked;
  document
    .querySelectorAll("#termsPage .terms:not(#termsAll)")
    .forEach((item) => {
      item.checked = checkStatus;
    });
});

// 다음 버튼 클릭 시 필수 동의 체크 검사
nextToForm.addEventListener("click", () => {
  const checks = document.querySelectorAll("#termsPage .terms:not(#termsAll)");
  let allChecked = true;
  checks.forEach((item) => {
    if (!item.checked) allChecked = false;
  });

  if (!allChecked) {
    alert("모든 필수 약관에 동의해주세요.");
    return;
  }

  termsPage.style.display = "none";

  // 개인, 기업 선택에 따라 폼 보여주기
  if (selectedType === "personal") {
    signupFormPage.style.display = "block";
    companySignupFormPage.style.display = "none";
    document.getElementById("user_type").value = "individual";
  } else {
    signupFormPage.style.display = "none";
    companySignupFormPage.style.display = "block";
    document.getElementById("user_type").value = "company";
  }
});

// 일반 개인 회원가입 실시간 유효성 검사 이벤트
signupInputs = signupFormPage.querySelectorAll("input");

emailInput = signupInputs[0];
pwInput = signupInputs[1];
pwCheckInput = signupInputs[2];
nameInput = signupInputs[3];
nicknameInput = signupInputs[4];
phoneInput = signupInputs[5];

// 이메일 실시간 검사
/**
 * @TODO 이메일 중복 체크 조건
 */
emailInput.addEventListener("input", () => {
  if (!regExp.email.test(emailInput.value)) {
    emailMsg.style.color = "red";
    emailMsg.textContent = "올바르지 않는 이메일 형식";
    validityCheck.email = 0;
  } else if (false) {
    // fetch 비동기를 통한 이메일 중복 체크 조건 추가 필요
    emailMsg.style.color = "red";
    emailMsg.textContent = "이미 사용중인 이메일입니다";
  } else {
    emailMsg.style.color = "green";
    emailMsg.textContent = "사용 가능한 이메일입니다";
  }
  emailInput.reportValidity();
});

// 비밀번호 실시간 검사
pwInput.addEventListener("input", () => {
  if (!regExp.pw.test(pwInput.value)) {
    pwMsg.style.color = "red";
    pwMsg.textContent = "영문+숫자 포함 6~16자 입력";
  } else {
    pwMsg.style.color = "green";
    pwMsg.textContent = "사용 가능한 비밀번호입니다";
  }
  pwInput.reportValidity();
});

// 비밀번호 확인 실시간 검사
pwCheckInput.addEventListener("input", () => {
  if (pwInput.value !== pwCheckInput.value) {
    pwCheckMsg.style.color = "red";
    pwCheckMsg.textContent = "비밀번호가 일치하지 않습니다";
  } else {
    pwCheckMsg.style.color = "green";
    pwCheckMsg.textContent = "비밀번호가 일치합니다";
  }
  pwCheckInput.reportValidity();
});

// 이름 검사
nameInput.addEventListener("input", () => {
  if (!regExp.name.test(nameInput.value)) {
    nameInput.setCustomValidity("2자이상 입력");
  } else {
    nameInput.setCustomValidity("");
  }
  nameInput.reportValidity();
});

// 핸드폰 검사
phoneInput.addEventListener("input", () => {
  if (!regExp.phone.test(phoneInput.value)) {
    phoneInput.setCustomValidity("숫자만 10~11자 입력");
  } else {
    phoneInput.setCustomValidity("");
  }
  phoneInput.reportValidity();
});

nicknameInput.addEventListener("input", () => {
  if (!regExp.nickname.test(nicknameInput.value)) {
    nicknameMsg.style.color = "red";
    nicknameMsg.textContent = "2~10자 입력";
  } else {
    nicknameMsg.style.color = "green";
    nicknameMsg.textContent = "사용 가능한 닉네임입니다";
  }
  nicknameInput.reportValidity();
});

// 기업 회원가입 실시간 유효성 검사
companySignupInputs = companySignupFormPage.querySelectorAll("input");
companyNameInput = companySignupInputs[0];
companyRegNoInput = companySignupInputs[1];
companyPhoneInput = companySignupInputs[2];
companyAddressInput = companySignupInputs[3];
companyWebsiteInput = companySignupInputs[4];
companyEmailInput = companySignupInputs[5];
companyPwInput = companySignupInputs[6];
companyPwCheckInput = companySignupInputs[7];

// 여기서 기업 이벤트 등록
companyNameInput.addEventListener("input", () => {
  if (companyNameInput.value.length < 2) {
    companyNameInput.setCustomValidity("회사 이름을 입력해주세요.");
  } else {
    companyNameInput.setCustomValidity("");
  }
  companyNameInput.reportValidity();
});

companyRegNoInput.addEventListener("input", () => {
  if (companyRegNoInput.value.length < 10) {
    companyRegNoInput.setCustomValidity("사업자 등록번호 10자리 입력");
  } else {
    companyRegNoInput.setCustomValidity("");
  }
  companyRegNoInput.reportValidity();
});

companyPhoneInput.addEventListener("input", () => {
  if (!regExp.phone.test(companyPhoneInput.value)) {
    companyPhoneInput.setCustomValidity("숫자만 10~11자 입력");
  } else {
    companyPhoneInput.setCustomValidity("");
  }
  companyPhoneInput.reportValidity();
});

companyEmailInput.addEventListener("input", () => {
  if (!regExp.email.test(companyEmailInput.value)) {
    companyEmailInput.setCustomValidity("올바른 이메일 형식");
  } else {
    companyEmailInput.setCustomValidity("");
  }
  companyEmailInput.reportValidity();
});

companyPwInput.addEventListener("input", () => {
  if (!regExp.pw.test(companyPwInput.value)) {
    companyPwInput.setCustomValidity("영문+숫자 포함 6~16자 입력");
  } else {
    companyPwInput.setCustomValidity("");
  }
  companyPwInput.reportValidity();
});

companyPwCheckInput.addEventListener("input", () => {
  if (companyPwInput.value !== companyPwCheckInput.value) {
    companyPwCheckInput.setCustomValidity("비밀번호가 일치하지 않습니다");
  } else {
    companyPwCheckInput.setCustomValidity("");
  }
  companyPwCheckInput.reportValidity();
});

// 실시간 유효성 검사 및 아이디 중복 체크
const regExp = {
  name: /^[가-힣a-zA-Z0-9]{2,10}$/,
  nickname: /^[가-힣a-zA-Z0-9]{2,10}$/,
  pw: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,16}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\d{10,11}$/,
};

// 메세지 영역
const emailMsg = document.getElementById("emailMessage");
const pwMsg = document.getElementById("pwMessage");
const pwCheckMsg = document.getElementById("pwCheckMessage");
const nicknameMsg = document.getElementById("nicknameMessage");

const mobileToggle = document.querySelector(".mobile-toggle");

signUpButton.addEventListener("click", () => {
  container.classList.add("right-panel-active");
  mobileToggle.style.display = "none";
});

loginButton.addEventListener("click", () => {
  container.classList.remove("right-panel-active");
  mobileToggle.style.display = "none";

  // 애니메이션 끝나고 다시 보이기
  setTimeout(() => {
    mobileToggle.style.display = "flex";
  }, 600); // 애니메이션 시간에 맞춰 (0.6s)
});

const closeModal3 = document.getElementById("closeModal3");

// 기업 전용 닫기 버튼 처리
closeModal3.addEventListener("click", closeModalFunc);

// 개인 선택 시 → 개인 폼만 열고 기업 폼 닫기
selectPersonalBtn.addEventListener("click", () => {
  signupSelectModal.style.display = "none";
  signupModal.style.display = "block";
  termsPage.style.display = "block";
  signupFormPage.style.display = "none"; // << 개인폼 숨기기
  companySignupFormPage.style.display = "none"; // << 기업폼 숨기기
  selectedType = "personal"; // 개인 선택 세팅
});

// 기업 선택 시 → 기업 폼만 열고 개인 폼 닫기
selectCompanyBtn.addEventListener("click", () => {
  signupSelectModal.style.display = "none";
  signupModal.style.display = "block";
  termsPage.style.display = "block";
  signupFormPage.style.display = "none"; // << 개인폼 숨기기
  companySignupFormPage.style.display = "none"; // << 기업폼 숨기기
  selectedType = "company"; // 기업 선택 세팅
});

// ✅ 로그인 처리
const loginSubmitBtn = loginForm.querySelector('button[type="submit"]');
loginSubmitBtn.type = "button";

loginSubmitBtn.addEventListener("click", async () => {
  const email = loginForm.querySelector('input[name="email"]').value;
  const password = loginForm.querySelector('input[name="password"]').value;

  try {
    const res = await fetch("/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include" // ✅ 쿠키 자동 전송 설정
    });

    const data = await res.json();

    if (res.ok) {
      alert("로그인 성공!");
      window.location.href = "/";
    } else {
      alert(data.message || "로그인 실패");
    }
  } catch (err) {
    console.error("로그인 오류:", err);
    alert("서버 오류가 발생했습니다.");
  }
});
