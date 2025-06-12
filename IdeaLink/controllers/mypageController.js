const userModel = require("../models/userModel");
const postModel = require("../models/postModel");
const answerModel = require("../models/answerModel");
const commentModel = require("../models/commentModel");
const bookmarkModel = require("../models/bookmarkModel");

// // 내가 작성한 게시글 + 답글 + 댓글(예정) 조회
// exports.mypage = async (req, res, next) => {
//   const user_id = req.user.user_id || null;

//   if (!user_id) return next(new Error("user_id가 없습니다."));

//   try {
//     // 마이페이지 탭 메뉴 클릭 시 맞는 데이터를 비동기로 가져오려 했는데
//     // 일단 그냥 한번에 다 가져가는 걸로
//     // 알림가져오는게 초기세팅
//     const notifications = await notificationModel.getNotificationsByUserId(user_id); // 알림 정보
    console.log("알림 정보:", notifications);
    const userInfo = await userModel.selectUserByUserID(user_id); // 유저 정보
//     const myPosts = await postModel.getMyPosts(user_id); // 내가 작성한 게시글
//     const myAnswers = await answerModel.getMyAnswers(user_id); // 내가 작성한 답글
//     const myComments = await commentModel.getMyComments(user_id); // 내가 작성한 댓글
//     const bookmarks = await bookmarkModel.getUserBookmarks(user_id); // 내 북마크
//     const pointLogs = await userModel.getPointLogsByUserId(user_id); // 포인트 로그
//     const chattings = await chatModel.getChattingRooms(user_id); // 내 채팅방
    const result ={
//       notifications: notifications || null,
      userInfo: userInfo || null,
//       myPosts: myPosts || null,
//       myAnswers: myAnswers || null,
//       myComments: myComments || null,
//       bookmarks: bookmarks || null,
//       pointLogs: pointLogs || null,
//       chattings: chattings || null,
    }
//     // console.log("최종 데이터:", result);
//     res.render("mypage", result);
//   } catch (err) {
//     next(err);
//   }
// };

// 마이페이지 렌더링 거래 내역 포함.
exports.renderMypage = async (req, res) => {
  const user_id = req.query.user_id;

  try {
    const tradeHistory = await postModel.getTradeHistory(user_id);
    const userInfo = await userModel.getUserById(user_id);
    const pointLogs = await userModel.getPointLogsByUserId(user_id);
    const bookmarks = await userModel.getBookmarksByUserId(user_id);
    const myPosts = await postModel.getMyPostsByUserId(user_id);
    const myAnswers = await answerModel.getMyAnswers(user_id);
    const myComments = await commentModel.getMyComments(user_id);
    const requestedDirectPosts = await postModel.getRequestedDirectPosts(user_id);
    const requestedAnswerPosts = await postModel.getRequestedAnswerPosts(user_id);


    // 판매자 판별용: 판매글/구매글 구분
    const seller_id_map = {};
  for (const post of myPosts) {
  if (post.selected_answer_id) {
    const reservedAnswer = await answerModel.getAnswerById(post.selected_answer_id);
    seller_id_map[post.post_id] = reservedAnswer ? reservedAnswer.user_id : null;
  } else {
    // 일반 판매글이라면 작성자가 판매자
    seller_id_map[post.post_id] = post.user_id;
  }
}





    // 내 답변이 선택된 거래인지 판별 (답변 기준 거래 수락 버튼용)
    const confirmTargetMap = {}; // answer_id → { post_id, isMine, status }

    for (const answer of myAnswers) {
        const post = await postModel.getPostById(answer.post_id);
        if (!post) continue;

        const isMine = String(post.selected_answer_id) === String(answer.answer_id);

        if (post.status === '거래중' || post.status === '거래완료') {
          confirmTargetMap[answer.answer_id] = {
            post_id: post.post_id,
            status: post.status,
            isMine: isMine
          };
        }
      }

    res.render("mypage", {
      user: req.user,
      user_id,
      tradeHistory,
      userInfo,
      pointLogs,
      bookmarks,
      myPosts,
      myAnswers,
      myComments,
      requestedDirectPosts,
      requestedAnswerPosts,
      seller_id_map,
      confirmTargetMap
    });
  } catch (err) {
    console.error("마이페이지 렌더링 오류:", err);
    res.status(500).send("서버 오류");
  }
};


