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

    const user_id = userResult.insertId;

    const clientIp = getClientIp(req);
    await logModel.insertUserLog({
      user_id: user_id,
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
        user_id: user_id
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
    const user_id = user.user_id;  // user_id가 제대로 존재하는지 확인
    if (!user_id) {
      return res.status(500).json({ message: "사용자 정보 오류" });
    }

    // 클라이언트 IP 주소 추출
    const clientIp = getClientIp(req);

    // 로그인 기록 추가
    await logModel.insertUserLog({
      user_id: user_id,
      user_log_event: "login",
      user_log_ip: clientIp
    });

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        user_id: user_id,
        email: user.email,
        user_type: user.user_type,
        nick_name: user.nick_name,
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
        user_id: user_id,
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


