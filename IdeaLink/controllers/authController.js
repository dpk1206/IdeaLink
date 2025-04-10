// 회원 관련 DB 함수 가져오기
const testModel = require("../models/userModel");
const companyModel = require("../models/companyModel");

// ✅ 회원가입 처리 함수 (개인/기업 구분)
exports.registerUser = async function (req, res) {
  try {
    const {
      userType,
      name,
      email,
      password,
      company_name,
      business_id,
      company_phone,
      company_address,
      company_website,
      company_email,
      company_password
    } = req.body;

    // 회원가입용 이메일 & 비밀번호 설정
    const finalEmail = userType === "company" ? company_email : email;
    const finalPassword = userType === "company" ? company_password : password;
    const finalName = userType === "company" ? company_name : name;

    // ✅ 이메일 중복 확인
    const isDuplicate = await testModel.checkEmailDuplicate(finalEmail);
    if (isDuplicate) {
      return res.status(400).send("이미 존재하는 이메일입니다.");
    }

    // ✅ 사용자 테이블에 기본 정보 저장
    const userResult = await testModel.insertUser(userType, finalName, finalEmail, finalPassword);
    const userId = userResult.insertId;

    // ✅ 기업회원일 경우 companies 테이블에 추가 정보 저장
    if (userType === "company") {
        await companyModel.insertCompanyInfo( 
        company_name,
        business_id,
        company_phone,
        company_address,
        company_website,
        company_email,
        company_password,
        userId
      );
    }

    // 회원가입 성공 후 로그인 페이지로 이동
    res.redirect("/sign_in_up");  // 로그인 페이지로 리디렉션
  } catch (err) {
    console.error("회원가입 오류:", err);
    res.status(500).send("회원가입 실패");
  }
};

// ✅ 로그인 처리 함수
exports.loginUser = async function (req, res) {
  try {
    const { email, password } = req.body;

    const user = await testModel.findUserByEmail(email);

    if (!user || user.password !== password) {
      return res.status(401).send("이메일 또는 비밀번호가 일치하지 않습니다.");
    }

    // 로그인 성공 후 메인 페이지로 이동
    res.redirect("http://localhost:3000");  // 메인 페이지로 리디렉션
  } catch (err) {
    console.error("로그인 오류:", err);
    res.status(500).send("로그인 실패");
  }
};
