const userModel = require("../models/userModel");
const companyModel = require("../models/companyModel");
const jwt = require("jsonwebtoken");
const axios = require("axios");
require("dotenv").config();

// 회원가입 처리
exports.registerUser = async (req, res) => {
  try {
    const {
      user_type, // 'individual' or 'company'
      email,
      password,
      name,
      nick_name,
      phone,
      join_type, // 'N', 'K' ,'E'
      sns_id,

      // 회사 정보
      company_name,
      business_id,
      company_phone,
      company_address,
      company_website,
      company_email,
      company_password
    } = req.body;

    const finalEmail = user_type === "company" ? company_email : email;
    const finalPassword = user_type === "company" ? company_password : password;
    const finalName = user_type === "company" ? company_name : name;
    const finalNick = user_type === "company" ? company_name : nick_name;
    const finalPhone = user_type === "company" ? company_phone : phone;

    const isDuplicate = await userModel.checkEmailDuplicate(finalEmail);
    if (isDuplicate) {
      return res.status(400).send("이미 존재하는 이메일입니다.");
    }

    const userResult = await userModel.insertUser({
      email: finalEmail,
      password: finalPassword,
      name: finalName,
      nick_name: finalNick,
      phone: finalPhone,
      user_type: user_type,
      join_type,
      sns_id: sns_id || null
    });

    const userId = userResult.insertId;

    if (user_type === "company") {
      await companyModel.insertCompanyInfo({
        company_name,
        business_id,
        company_phone,
        company_address,
        company_website,
        company_email,
        company_password,
        user_id: userId
      });
    }
    res.redirect("/login_signup");
  } catch (err) {
    console.error("회원가입 오류:", err);
    res.status(500).send("회원가입 실패");
  }
};

// 로그인 처리
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findUserByEmail(email);

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "이메일 또는 비밀번호가 일치하지 않습니다." });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        user_type: user.user_type, // 수정됨
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    res.status(200).json({
      message: "로그인 성공",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        user_type: user.user_type,
      },
    });
  } catch (err) {
    console.error("로그인 오류:", err);
    res.status(500).json({ message: "로그인 실패" });
  }
};

// 카카오 로그인 콜백
exports.kakaoCallback = async (req, res) => {
  try {
    const code = req.query.code;

    const tokenRes = await axios.post("https://kauth.kakao.com/oauth/token", null, {
      params: {
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_REST_API_KEY,
        redirect_uri: process.env.KAKAO_REDIRECT_URI,
        code,
      },
      headers: { "Content-type": "application/x-www-form-urlencoded;charset=utf-8" },
    });

    const kakaoAccessToken = tokenRes.data.access_token;

    const userRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${kakaoAccessToken}` },
    });

    const kakaoUser = userRes.data;
    const email = kakaoUser.kakao_account?.email;
    const nickname = kakaoUser.properties?.nickname;

    if (!email) {
      return res.status(400).send("카카오 계정에 이메일이 없습니다.");
    }

    let user = await userModel.findUserByEmail(email);

    if (!user) {
      const newUser = await userModel.insertUser({
        email,
        password: null,
        name: nickname,
        nick_name: nickname,
        phone: null,
        user_type: "individual",
        join_type: "K",
        sns_id: kakaoUser.id.toString()
      });

      user = { id: newUser.insertId, email, user_type: "individual" };
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    res.redirect(`http://localhost:3000/sign_in_up?token=${token}`);
  } catch (err) {
    console.error("카카오 로그인 오류:", err);
    res.status(500).send("카카오 로그인 실패");
  }
};
