const userModel = require("../models/userModel");
const postModel = require("../models/postModel");
const answerModel = require("../models/answerModel");
const commentModel = require("../models/commentModel");
const bookmarkModel = require("../models/bookmarkModel");

// 내가 작성한 게시글 + 답글 + 댓글(예정) 조회
exports.mypage = async (req, res, next) => {
  const user_id = req.user.user_id || null;

  if (!user_id) return next(new Error("user_id가 없습니다."));

  try {
    // 마이페이지 탭 메뉴 클릭 시 맞는 데이터를 비동기로 가져오려 했는데
    // 일단 그냥 한번에 다 가져가는 걸로
    // 알림가져오는게 초기세팅
    const userInfo = await userModel.selectUserByUserID(user_id); // 유저 정보
    const myPosts = await postModel.getMyPosts(user_id); // 내가 작성한 게시글
    const myAnswers = await answerModel.getMyAnswers(user_id); // 내가 작성한 답글
    const myComments = await commentModel.getMyComments(user_id); // 내가 작성한 댓글
    const bookmarks = await bookmarkModel.getUserBookmarks(user_id); // 내 북마크
    const pointLogs = await userModel.getPointLogsByUserId(user_id); // 포인트 로그
    const result ={
      userInfo: userInfo || null,
      myPosts: myPosts || null,
      myAnswers: myAnswers || null,
      myComments: myComments || null,
      bookmarks: bookmarks || null,
      pointLogs: pointLogs || null,
    }
    // console.log("최종 데이터:", result);
    res.render("mypage", result);
  } catch (err) {
    next(err);
  }
};
