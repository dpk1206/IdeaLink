const reportModel = require('../models/reportModel');

// 신고 등록
const submitReport = async (req, res) => {
  const { post_id, answer_id, reason } = req.body;
  const reporter_id = req.user?.user_id;

  if (!reporter_id) {
    return res.status(401).json({ success: false, message: "로그인이 필요합니다." });
  }

  try {
    await reportModel.insertReport({ post_id, answer_id, reporter_id, reason });
    res.json({ success: true, message: "신고가 접수되었습니다." });
  } catch (err) {
    res.status(500).json({ success: false, message: "신고 처리 중 오류가 발생했습니다." });
  }
};

// 내 신고 내역 조회
const getMyReports = async (req, res) => {
  const reporter_id = req.user?.user_id;

  if (!reporter_id) return res.status(401).json({ success: false, message: "로그인이 필요합니다." });

  const reports = await reportModel.getReportsByUser(reporter_id);
  res.render('mypage_reports', { reports });
};

// 관리자 - 전체 신고 목록
const getAllReports = async (req, res) => {
  const reports = await reportModel.getAllReports();
  res.render('admin', { reports });
};

// 관리자 - 신고 처리
const replyReport = async (req, res) => {
  const { report_id } = req.params;
  const { reply } = req.body;

  try {
    await reportModel.replyToReport(report_id, reply);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "답변 등록 실패" });
  }
};



// 제대로 된 export
module.exports = {
  submitReport,
  getMyReports,
  getAllReports,
  replyReport
};
