const bookmarkModel = require("../models/bookmarkModel");

// 북마크 등록
exports.addBookmark = async (req, res, next) => {
  const user_id = req.user.user_id || null;
  const post_id = req.body.post_id || null;

  if (!user_id) return next(new Error("북마크 등록 중 오류 - user_id가 없습니다."));
  if (!post_id) return next(new Error("북마크 등록 중 오류 - post_id가 없습니다."));

  try {
    const result = await bookmarkModel.insertBookmark(user_id, post_id);
    res.send({ success: result.success, message: result.message || "북마크 등록 완료" });
  } catch (err) {
    next(err);
  }
};

// 북마크 삭제
exports.removeBookmark = async (req, res, next) => {
  const user_id = req.user.user_id || null;
  const post_id = req.body.post_id || null;

  if (!user_id) return next(new Error("북마크 삭제 중 오류 - user_id가 없습니다."));
  if (!post_id) return next(new Error("북마크 삭제 중 오류 - post_id가 없습니다."));

  try {
    const result = await bookmarkModel.deleteBookmark(user_id, post_id);
    res.send({ success: result.success, message: "북마크 삭제 완료" });
  } catch (err) {
    next(err);
  }
};



