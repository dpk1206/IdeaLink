const dbconn = require('../config/dbconn');

// 신고 등록 (게시글 또는 답글)
exports.insertReport = async ({ post_id, answer_id, reporter_id, reason }) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  // 값 정리 (문자열 "null" 들어오는 경우 대비)
  const postId = post_id && post_id !== "null" ? Number(post_id) : null;
  const answerId = answer_id && answer_id !== "null" ? Number(answer_id) : null;

  console.log("📤 신고 INSERT 시도:", { postId, answerId, reporter_id, reason });

  const sql = `
    INSERT INTO report (post_id, answer_id, reporter_id, reason)
    VALUES (?, ?, ?, ?)
  `;

  try {
    await conn.promise().query(sql, [postId, answerId, reporter_id, reason]);
    console.log("✅ 신고 저장 완료");
  } catch (err) {
    console.error("❌ 신고 INSERT 실패:", err);
  } finally {
    await conn.end();
  }
};


// 유저가 신고한 내역 조회 (마이페이지용)
exports.getReportsByUser = async (reporter_id) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
    SELECT r.*, p.title AS post_title, a.content AS answer_content
    FROM report r
    LEFT JOIN post p ON r.post_id = p.post_id
    LEFT JOIN answer a ON r.answer_id = a.answer_id
    WHERE r.reporter_id = ?
    ORDER BY r.created_at DESC
  `;
  const [rows] = await conn.promise().query(sql, [reporter_id]);
  await conn.end();
  return rows;
};

// 관리자용 전체 신고 내역
exports.getAllReports = async () => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
    SELECT r.*, u.nick_name AS reporter_name, p.title AS post_title, a.content AS answer_content
    FROM report r
    JOIN user u ON r.reporter_id = u.user_id
    LEFT JOIN post p ON r.post_id = p.post_id
    LEFT JOIN answer a ON r.answer_id = a.answer_id
    ORDER BY r.created_at DESC
  `;
  const [rows] = await conn.promise().query(sql);
  await conn.end();
  return rows;
};

// 관리자 답변 및 상태 처리
exports.replyToReport = async (report_id, reply) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
    UPDATE report
    SET reply = ?, status = '처리완료'
    WHERE report_id = ?
  `;
  await conn.promise().query(sql, [reply, report_id]);
  await conn.end();
};


