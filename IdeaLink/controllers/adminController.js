const dbconn = require('../config/dbconn');
const postModel = require("../models/postModel");
const answerModel = require("../models/answerModel");
const userModel = require("../models/userModel");
const adminModel = require("../models/adminModel");
const ADMIN_ID = 1; // 관리자 고정 ID
const reportModel = require('../models/reportModel');

exports.renderAdminPage = async (req, res) => {
  try {
    const posts = await adminModel.getAllPostsWithAnswers(); // ⬅️ 모델에서 가져오기
    const reports = await reportModel.getAllReports();

    res.render('admin', {
      posts,
      reports
    });
  } catch (err) {
    console.error('관리자 페이지 렌더링 오류:', err);
    res.status(500).send('서버 오류');
  }
};


//관리자(사이트측) 포인트 조회
exports.getAdminTotalPoint = async (req, res) => {
  try {
    const conn = await dbconn.init();
    await dbconn.connect(conn);
    const sql = `SELECT point FROM user WHERE user_type = 'admin' LIMIT 1`;
    const [rows] = await conn.promise().query(sql);
    await conn.end();

    const total = rows[0]?.point || 0;
    res.json({ success: true, total });
  } catch (err) {
    console.error("🔥 관리자 포인트 조회 오류:", err);
    res.json({ success: false });
  }
};

exports.getAllPointLogs = async (req, res) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  try {
    const sql = `
      SELECT 
        pl.created_at,
        u.nick_name,
        pl.type,
        pl.amount,
        pl.description
      FROM point_log pl
      LEFT JOIN user u ON pl.user_id = u.user_id
      ORDER BY pl.created_at DESC
    `;
    const [rows] = await conn.promise().query(sql);
    res.json({ success: true, logs: rows });
  } catch (err) {
    console.error('포인트 로그 조회 실패:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  } finally {
    await conn.end();
  }
};

exports.getAllPostsWithAnswers = exports.renderAdminPage;


exports.selectAnswerByAdmin = async (req, res) => {
  const { post_id, answer_id, reward_point } = req.body;
  const admin = req.user;

  if (!admin || admin.user_type !== 'admin') {
    return res.status(403).json({ success: false, message: '관리자만 가능합니다.' });
  }

  const post = await postModel.getPostById(post_id);
  const answer = await answerModel.getAnswerById(answer_id);
  const answerList = await answerModel.getAnswersByPostId(post_id);
  post.answers = answerList;

  if (!post || !answer) {
    return res.status(404).json({ success: false, message: '게시글 또는 답변을 찾을 수 없습니다.' });
  }

  const updated = await postModel.markAnswerAsSelected(post_id, answer_id);
  if (!updated) {
    return res.status(500).json({ success: false, message: '채택 처리 실패' });
  }

  // 수수료 없이 포인트 전액 지급
  await userModel.deductPointFromUser(ADMIN_ID, reward_point);
  await userModel.addPointToUser(answer.user_id, reward_point);
  await userModel.insertPointLog(ADMIN_ID, 'hold_release', reward_point, `답글 채택 출금 - post_id: ${post_id}`);
  await userModel.insertPointLog(answer.user_id, 'admin_reward', reward_point, `관리자 채택 보상 - post_id: ${post_id}`);

  res.json({ success: true });
};

//공지사항 
// 1. 목록 조회
exports.getNotices = async (req, res) => {
  const rows = await adminModel.getNotices();
  res.json({ success: true, notices: rows });
};

// 2. 등록
exports.addNotice = async (req, res) => {
  const { title, content } = req.body;
  await adminModel.insertNotice(title, content);
  res.json({ success: true });
};

// 3. 수정
exports.editNotice = async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  await adminModel.updateNotice(id, title, content);
  res.json({ success: true });
};

// 4. 삭제
exports.deleteNotice = async (req, res) => {
  const { id } = req.params;
  await adminModel.deleteNotice(id);
  res.json({ success: true });
};

// 관리자용 게시글,답글 상태변경
exports.updateContentStatus = async (req, res) => {
  const { id, status, type } = req.body;

  try {
    if (type === 'post') {
      await postModel.updatePostStatus(id, status);
    } else if (type === 'answer') {
      await answerModel.updateAnswerModerationStatus(id, status);
    } else {
      return res.status(400).json({ success: false, message: "잘못된 type" });
    }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// 관리자 통계 조회
exports.getAdminStats = async (req, res) => {
  try {
    const totalFee = await adminModel.getTotalPlatformFee();
    const monthlyFee = await adminModel.getMonthlyFeeStats();
    const monthlyComplete = await adminModel.getMonthlyTradeStats();

    // 누적 통계
    const totalRequests = await adminModel.getTotalPurchaseRequests();
    const totalCompleted = await adminModel.getTotalCompletedTrades();

    res.json({
      success: true,
      totalFee,
      monthlyFee,
      monthlyTrade: monthlyComplete ,
      totalRequests,
      totalCompleted
    });
  } catch (err) {
    console.error('📊 관리자 통계 조회 실패:', err);
    res.json({ success: false, message: '통계 조회 중 오류 발생' });
  }
};
// 카테고리별 통계 조회
exports.getCategoryStats = async (req, res) => {
  try {
    const rows = await adminModel.getCategoryTradeStats();
    res.json({ success: true, stats: rows });
  } catch (err) {
    console.error("카테고리 통계 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
};