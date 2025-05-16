const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const logModel = require("../models/logModel");
const getClientIp = require("request-ip").getClientIp;
require("dotenv").config();

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
    const nick_name = naverUser.nickname || naverUser.name || "네이버사용자";
    let phone = naverUser.mobile || null; // 네이버 API에서 제공하는 전화번호 정보
    if (phone) {
        // 1. 모든 공백, 하이픈(-) 등 제거
        phone = phone.replace(/[\s-]/g, "");
      }
    if (!email) {
      return res.status(400).send("네이버 계정에 이메일이 없습니다.");
    }

    // 3. DB에 sns_id + join_type(N)로 유저 조회
    let user = await userModel.findUserBySnsId(snsId, "N");
    console.log("ㅁㅁㅁㅁ조회결과 :", user);
    const clientIp = getClientIp(req); // 클라이언트 IP 추출

    if (!user) {
      // 4. 회원가입 처리
      const newUser = await userModel.insertUser({
        email,
        password: null,
        name,
        nick_name: nick_name,
        phone: phone,
        user_type: "individual",
        join_type: "N",
        sns_id: snsId,
      });

      user = { user_id: newUser.insertId, email, user_type: "individual", nick_name:nick_name };

      console.log("New user ID:", newUser.insertId);
      console.log(user);

      // 회원가입 로그 기록
      await logModel.insertUserLog({
        user_id: user.user_id,
        user_log_event: "signup",
        user_log_ip: clientIp,
      });
    } else {
      // 로그인 로그 기록
      await logModel.insertUserLog({
        user_id: user.user_id,
        user_log_event: "login",
        user_log_ip: clientIp,
      });
    }

    // 5. JWT 발급
    const token = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        user_type: user.user_type,
        nick_name: user.nick_name,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // 로컬환경일 경우 false / 운영에서는 true
      sameSite: "Lax", // 혹은 "Strict"
      maxAge: 1000 * 60 * 60 * 24, // 1일
    });

    res.redirect("/");
  } catch (err) {
    console.error("네이버 로그인 오류:", err);
    next(err); // 에러를 전달
  }
};
