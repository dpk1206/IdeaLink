const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const logModel = require("../models/logModel");
const getClientIp = require("request-ip").getClientIp;
require("dotenv").config();

// 카카오 로그인 콜백
exports.kakaoCallback = async (req, res, next) => {
  try {
    const code = req.query.code;

    const tokenRes = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      null,
      {
        params: {
          grant_type: "authorization_code",
          client_id: process.env.KAKAO_REST_API_KEY,
          redirect_uri: process.env.KAKAO_REDIRECT_URI,
          code,
        },
        headers: {
          "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
        },
      }
    );

    const kakaoAccessToken = tokenRes.data.access_token;

    const userRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${kakaoAccessToken}` },
    });

    const kakaoUser = userRes.data;
    const snsId = kakaoUser.id.toString();
    const email = kakaoUser.kakao_account?.email;
    const nick_name = kakaoUser.properties?.nickname;
    const name = kakaoUser.kakao_account?.name;
    let phone = kakaoUser.kakao_account?.phone_number || null;
    if (phone) {
      // 1. 국제번호 +82 또는 82로 시작하는 부분을 0으로 대체
      let normalized = phone.replace(/^(\+82|82)[\s-]?/, "0");
      // 2. 모든 공백, 하이픈(-) 등 제거
      normalized = normalized.replace(/[\s-]/g, "");
      phone = normalized;
    }

    if (!email) {
      return res.status(400).send("카카오 계정에 이메일이 없습니다.");
    }

    // sns_id와 join_type(K)로 사용자 조회
    let user = await userModel.findUserBySnsId(snsId, "K");
    const clientIp = getClientIp(req); // 클라이언트 IP 추출

    if (!user) {
      // 사용자가 없으면 새로 가입
      const newUser = await userModel.insertUser({
        email,
        password: null,
        name: name,
        nick_name: nick_name,
        phone: phone,
        user_type: "individual",
        join_type: "K",
        sns_id: snsId,
      });

      user = {
        user_id: newUser.insertId,
        email,
        user_type: "individual",
        nick_name: nick_name,
      };

      console.log("New user ID:", newUser.insertId); // newUser.insertId가 제대로 반환되는지 확인

      // 회원가입 로그 기록
      await logModel.insertUserLog({
        user_id: user.user_id,
        user_log_event: "signup",
        user_log_ip: clientIp,
      });
    } else {
      console.log("Existing user ID:", user.user_id); // 기존 사용자의 user.id 확인

      // 로그인 기록 추가
      await logModel.insertUserLog({
        user_id: user.user_id,
        user_log_event: "login",
        user_log_ip: clientIp,
      });
    }
    console.log("user info before token:", user);

    // JWT 토큰 생성
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
    console.error("카카오 로그인 오류:", err);
    next(err); // 에러 전달
  }
};
