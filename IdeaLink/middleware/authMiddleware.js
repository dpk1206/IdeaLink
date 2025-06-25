const jwt = require("jsonwebtoken");
require("dotenv").config();
const notificationModel = require("../models/notificationModel");

module.exports = async function (req, res, next) {

  const token = req.cookies?.token;

  const skipPaths = ["/login_signup", "/users/login", "/users/logout", "/users/register", "/stylesheets", "/javascripts", "/images", "/wm_uploads", "/api",
    "/post/popular_posts", "/post/recent_posts", "/post/get_comments"];

  // 스킵 경로 확인 로그
  if (skipPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  console.log(`🔐 JWT 검증 실행 (${req.path})`);

  if (!token) {
    console.log(`❌ JWT 없음: ${req.path}`);
    req.user = null;
    res.locals.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    res.locals.user = decoded;
    console.log(`✅ JWT 검증 성공 (${req.path}):`, "USER_ID", decoded.user_id);

    // 안읽은 알림 개수 조회
    const count = await notificationModel.getUnreadNotificationCount(decoded.user_id);
    res.locals.unreadNotificationCount = count;
    console.log(`🔔 안 읽은 알림 갯수 (${req.path}):`, count);

    next();
  } catch (err) {
    console.error(`⛔ JWT 인증 실패 (${req.path}):`, err.message);
    req.user = null;
    res.locals.user = null;
    res.locals.unreadNotificationCount = 0;
    next();
  }
};
