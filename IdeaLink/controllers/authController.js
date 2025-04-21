const userModel = require("../models/userModel");
const companyModel = require("../models/companyModel");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const logModel = require('../models/logModel');
const getClientIp = require('request-ip').getClientIp;
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

    const clientIp = getClientIp(req);
    await logModel.insertUserLog({
      user_id: userId,
      user_log_event: 'signup',
      user_log_ip: clientIp
    });

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
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 이메일로 사용자 찾기
    const user = await userModel.findUserByEmail(email);

    // 사용자가 없으면 로그인 실패
    if (!user) {
      return res.status(401).json({ message: "이메일 또는 비밀번호가 일치하지 않습니다." });
    }

    // 비밀번호 검증
    if (user.password !== password) {
      return res.status(401).json({ message: "이메일 또는 비밀번호가 일치하지 않습니다." });
    }

    // 사용자 정보가 있을 경우
    const userId = user.user_id;  // user_id가 제대로 존재하는지 확인
    if (!userId) {
      return res.status(500).json({ message: "사용자 정보 오류" });
    }

    // 클라이언트 IP 주소 추출
    const clientIp = getClientIp(req);

    // 로그인 기록 추가
    await logModel.insertUserLog({
      user_id: userId,
      user_log_event: "login",
      user_log_ip: clientIp
    });

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        id: userId,
        email: user.email,
        user_type: user.user_type,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    // 로그인 성공 응답
    res.status(200).json({
      message: "로그인 성공",
      token,
      user: {
        id: userId,
        email: user.email,
        name: user.name,
        user_type: user.user_type,
      },
    });
  } catch (err) {
    console.error("로그인 오류:", err);
    next(err); // 에러 전달
    // res.status(500).json({ message: "로그인 실패" });
  }
};

// 카카오 로그인 콜백
exports.kakaoCallback = async (req, res, next) => {
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
    const snsId = kakaoUser.id.toString();
    const email = kakaoUser.kakao_account?.email;
    const nickname = kakaoUser.properties?.nickname;
    const name = kakaoUser.kakao_account?.name;
    const phone = kakaoUser.kakao_account?.phone_number || null;

    if (!email) {
      return res.status(400).send("카카오 계정에 이메일이 없습니다.");
    }

    // sns_id와 join_type(K)로 사용자 조회
    let user = await userModel.findUserBySnsId(snsId, 'K');
    const clientIp = getClientIp(req);  // 클라이언트 IP 추출

    if (!user) {
      // 사용자가 없으면 새로 가입
      const newUser = await userModel.insertUser({
        email,
        password: null,
        name: name,
        nick_name: nickname,
        phone: phone,
        user_type: "individual",
        join_type: "K",
        sns_id: snsId
      });

      user = { user_id: newUser.insertId, email, user_type: "individual" };

      console.log("New user ID:", newUser.insertId);  // newUser.insertId가 제대로 반환되는지 확인

      // 회원가입 로그 기록
      await logModel.insertUserLog({
        user_id: user.user_id,
        user_log_event: 'signup',
        user_log_ip: clientIp,
      });
    } else {
      console.log("Existing user ID:", user.user_id);  // 기존 사용자의 user.id 확인

      // 로그인 기록 추가
      await logModel.insertUserLog({
        user_id: user.user_id, 
        user_log_event: 'login',
        user_log_ip: clientIp,
      });
    }
    console.log("user info before token:", user);
    
    // JWT 토큰 생성
    const token = jwt.sign(
      {
        id: user.user_id, 
        email: user.email,
        user_type: user.user_type,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    res.redirect(`http://localhost:3000/login_signup?token=${token}`);
  } catch (err) {
    console.error("카카오 로그인 오류:", err);
    next(err); // 에러 전달
  }
};

// 네이버 로그인 콜백
exports.naverCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;

    // 1. 네이버 토큰 요청
    const tokenRes = await axios.get("https://nid.naver.com/oauth2.0/token", {
      params: {
        grant_type: "authorization_code",
        client_id: process.env.NAVER_CLIENT_ID,
        client_secret: process.env.NAVER_CLIENT_SECRET,
        code,
        state,
      },
    });

    const naverAccessToken = tokenRes.data.access_token;

    // 2. 네이버 사용자 정보 요청
    const userRes = await axios.get("https://openapi.naver.com/v1/nid/me", {
      headers: {
        Authorization: `Bearer ${naverAccessToken}`,
      },
    });

    const naverUser = userRes.data.response;

    const snsId = naverUser.id;
    const email = naverUser.email;
    const name = naverUser.name || naverUser.nickname || "네이버사용자";
    const phone = naverUser.mobile || null; // 네이버 API에서 제공하는 전화번호 정보

    if (!email) {
      return res.status(400).send("네이버 계정에 이메일이 없습니다.");
    }

    // 3. DB에 sns_id + join_type(N)로 유저 조회
    let user = await userModel.findUserBySnsId(snsId, 'N');
    console.log("ㅁㅁㅁㅁ조회결과 :", user );
    const clientIp = getClientIp(req); // 클라이언트 IP 추출

    if (!user) {
      // 4. 회원가입 처리
      const newUser = await userModel.insertUser({
        email,
        password: null,
        name,
        nick_name: name,
        phone: phone,
        user_type: "individual",
        join_type: "N",
        sns_id: snsId
      });

      user = { user_id: newUser.insertId, email, user_type: "individual" };

      console.log("New user ID:", newUser.insertId);

      // 회원가입 로그 기록
      await logModel.insertUserLog({
        user_id: user.user_id,
        user_log_event: 'signup',
        user_log_ip: clientIp,
      });
    } else {
      // 로그인 로그 기록
      await logModel.insertUserLog({
        user_id: user.user_id,
        user_log_event: 'login',
        user_log_ip: clientIp,
      });
    }

    // 5. JWT 발급
    const token = jwt.sign(
      {
        id: user.id || user.user_id,
        email: user.email,
        user_type: user.user_type,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    // 6. 리다이렉트 (프론트에 토큰 전달)
    res.redirect(`http://localhost:3000/login_signup?token=${token}`);
  } catch (err) {
    console.error("네이버 로그인 오류:", err);
    next(err); // 에러를 전달
  }
};
