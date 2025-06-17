const postModel = require("../models/postModel");
const commentModel = require("../models/commentModel");

// 댓글 추가
exports.addComment = async (req, res) => {
  const { post_id, content } = req.body;
  const user_id = req.user?.user_id;

  if (!user_id) return res.status(401).json({ error: "로그인 필요" });
  if (!content || !post_id) return res.status(400).json({ error: "필수 정보 없음" });

  try {
    await commentModel.addComment(post_id, user_id, content);
    const postInfo = await postModel.selectOnePost(post_id) // 원글 작성자의 user_id
    const sendNotification = req.app.get('sendNotification'); // 알림 전송 함수 가져옴
    await sendNotification(
      postInfo.user_id,
      user_id,
      "comment",
      post_id,
      content
    );
    res.json({ message: "댓글 등록 완료" });
  } catch (err) {
    console.error("댓글 등록 오류:", err);
    res.status(500).json({ error: "DB 오류" });
  }
};

// 댓글 조회
exports.getComments = async (req, res) => {
  const { post_id } = req.query;
  if (!post_id) return res.status(400).json({ error: "post_id 누락" });

  try {
    const comments = await commentModel.getCommentsByPostId(post_id);
    res.json(comments);
  } catch (err) {
    console.error("댓글 조회 오류:", err);
    res.status(500).json({ error: "DB 오류" });
  }
};

// 댓글 수정
exports.editComment = async (req, res) => {
  const { comment_id, content } = req.body;
  const user_id = req.user?.user_id;

  if (!user_id) return res.status(401).json({ error: "로그인 필요" });
  if (!comment_id || !content) return res.status(400).json({ error: "입력 누락" });

  try {
    const success = await commentModel.updateComment(comment_id, user_id, content);
    if (success) res.json({ message: "댓글 수정 완료" });
    else res.status(403).json({ error: "권한 없음" });
  } catch (err) {
    console.error("댓글 수정 오류:", err);
    res.status(500).json({ error: "DB 오류" });
  }
};

// 댓글 삭제
exports.removeComment = async (req, res) => {
  const { comment_id } = req.body;
  const user_id = req.user?.user_id;

  if (!user_id) return res.status(401).json({ error: "로그인 필요" });
  if (!comment_id) return res.status(400).json({ error: "입력 누락" });

  try {
    const success = await commentModel.deleteComment(comment_id, user_id);
    if (success) res.json({ message: "댓글 삭제 완료" });
    else res.status(403).json({ error: "권한 없음" });
  } catch (err) {
    console.error("댓글 삭제 오류:", err);
    res.status(500).json({ error: "DB 오류" });
  }
};