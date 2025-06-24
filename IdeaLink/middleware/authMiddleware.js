const jwt = require("jsonwebtoken");
require("dotenv").config();
const notificationModel = require("../models/notificationModel");

module.exports = async function (req, res, next) {
  const token = req.cookies?.token;

  const skipPaths = ["/login_signup", "/users/login", "/users/logout", "/users/register", "/stylesheets", "/javascripts", "/images", "/wm_uploads"];
  if (skipPaths.some(path => req.path.startsWith(path))) return next();

  console.log("JWT 검증 실행:");

  if (!token) {
    console.log("JWT 없음:");
    req.user = null;
    res.locals.user = null; // ❗️추가

    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    res.locals.user = decoded; // ❗️이걸로 EJS에서 <%= user %> 접근 가능
    console.log("JWT 검증 성공:", decoded,);
    // 안읽은 알림 개수 조회
    const count = await notificationModel.getUnreadNotificationCount(decoded.user_id);
    res.locals.unreadNotificationCount = count;
    console.log("안 읽은 알림 갯수:", count);
    next();
  } catch (err) {
    console.error("JWT 인증 또는 알림 개수 조회 실패:", err);
    req.user = null;
    res.locals.user = null; // ❗️토큰 에러 시도 대비
    res.locals.unreadNotificationCount = 0;
    next();
  }
};
