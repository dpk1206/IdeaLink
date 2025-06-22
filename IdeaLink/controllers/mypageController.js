const userModel = require("../models/userModel");
const postModel = require("../models/postModel");
const answerModel = require("../models/answerModel");
const commentModel = require("../models/commentModel");
const bookmarkModel = require("../models/bookmarkModel");
const chatModel = require("../models/chatModel");
const notificationModel = require("../models/notificationModel");
const reportModel = require("../models/reportModel");
const suggestionModel = require("../models/suggestionModel");

// 마이페이지 렌더링 거래 내역 포함.
exports.renderMypage = async (req, res, next) => {
  const user_id = req.query.user_id;

   // 관리자라면 관리자 페이지로 강제 리디렉션
  if (req.user?.user_type === 'admin') {
    return res.redirect('/admin/dashboard');
  }


  try {
    const tradeHistory = await postModel.getTradeHistory(user_id);
    const userInfo = await userModel.getUserById(user_id);
    const pointLogs = await userModel.getPointLogsByUserId(user_id);
    const myReports = await reportModel.getMyReports(user_id);
    const bookmarks = await bookmarkModel.getUserBookmarks(user_id);
    const myPosts = await postModel.getMyPostsByUserId(user_id);
    const myAnswers = await answerModel.getMyAnswers(user_id);
    const myComments = await commentModel.getMyComments(user_id);
    const mySuggestions = await suggestionModel.getSuggestionsByUserId(user_id);
    const requestedDirectPosts = await postModel.getRequestedDirectPosts(
      user_id
    );
    const requestedAnswerPosts = await postModel.getRequestedAnswerPosts(
      user_id
    );
    const notifications = await notificationModel.getNotificationsByUserId(
      user_id
    ); // 알림 정보
    const chattings = await chatModel.getChattingRooms(user_id); // 내 채팅방

    // 판매자 판별용: 판매글/구매글 구분
    const seller_id_map = {};
    for (const post of myPosts) {
      if (post.selected_answer_id) {
        const reservedAnswer = await answerModel.getAnswerById(
          post.selected_answer_id
        );
        seller_id_map[post.post_id] = reservedAnswer
          ? reservedAnswer.user_id
          : null;
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
  const purchase = await postModel.getPurchaseRequestByAnswerId(answer.answer_id);

  // ✅ 조건 없이 다 넣자
  confirmTargetMap[answer.answer_id] = {
    post_id: post.post_id,
    status: post.status,
    isMine,
    answer_price: answer.price ?? purchase?.answer_price ?? 0,
    proposed_price: purchase?.proposed_price ?? 0,
    buyer_nick: purchase?.buyer_nick ?? '-'
  };
}


    // 각 게시글에 moderation 로그 붙이기 (최근 1건만)
    for (const post of myPosts) {
      const logs = await postModel.getModerationLogsByTarget('post', post.post_id);
      post.moderation_logs = logs.length > 0 ? [logs[0]] : [];
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
      confirmTargetMap,
      notifications,
      chattings,
      myReports,
      mySuggestions
    });
  } catch (err) {
    console.error("마이페이지 렌더링 오류:", err);
    next(err);
  }
};

// 🔹 마이페이지 건의사항 제출
exports.submitSuggestion = async (req, res) => {
  const user_id = req.user?.user_id;
  const { content, post_id, answer_id } = req.body;

  if (!user_id || !content) {
    return res.json({ success: false, message: "내용 또는 사용자 정보 누락" });
  }

  try {
    await suggestionModel.insertSuggestion(user_id, content, post_id, answer_id);
    res.json({ success: true });
  } catch (err) {
    console.error("건의사항 저장 실패:", err);
    res.json({ success: false, message: "서버 오류" });
  }
};