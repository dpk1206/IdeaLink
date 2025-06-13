module.exports = function (req, res, next) {
  if (req.user && req.user.user_type === 'admin') {
    return next();
  }
  return res.status(403).send("관리자 전용 페이지입니다.");
};
