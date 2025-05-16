const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = function (req, res, next) {
  const token = req.cookies?.token;

  const skipPaths = ["/login_signup", "/users/login", "/users/logout",  "/users/register", "/stylesheets", "/javascripts", "/images"];
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
    console.log("JWT 검증 성공:", decoded);
    next();
  } catch (err) {
    console.error("JWT 검증 실패:", err);
    req.user = null;
    res.locals.user = null; // ❗️토큰 에러 시도 대비
    next();
  }
};
