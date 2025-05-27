const dbconn = require("../config/dbconn");

// 댓글 추가
exports.addComment = async function(post_id, user_id, content) {
  const conn = await dbconn.init();    
  await dbconn.connect(conn);         
  const sql = `INSERT INTO comment (post_id, user_id, content) VALUES (?, ?, ?)`;
  try {
    await conn.promise().query(sql, [post_id, user_id, content]);
  } finally {
    await conn.end();
  }
};

// 댓글 목록 조회
exports.getCommentsByPostId = async function(post_id) {
  const conn = await dbconn.init();   
  await dbconn.connect(conn);      
  const sql = `
    SELECT c.comment_id, c.user_id, c.content, c.created_at, u.nick_name
    FROM comment c
    JOIN user u ON c.user_id = u.user_id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `;
  try {
    const [rows] = await conn.promise().query(sql, [post_id]);
    return rows;
  } finally {
    await conn.end();
  }
};

// 댓글 삭제 (내 댓글인지 확인 포함)
exports.deleteComment = async (comment_id, user_id) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
    DELETE FROM comment
    WHERE comment_id = ? AND user_id = ?
  `;
  try {
    const [result] = await conn.promise().query(sql, [comment_id, user_id]);
    return result.affectedRows > 0; // 삭제 성공 여부
  } finally {
    await conn.end();
  }
};

// 댓글 수정 (내 댓글인지 확인 포함)
exports.updateComment = async (comment_id, user_id, content) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
    UPDATE comment
    SET content = ?
    WHERE comment_id = ? AND user_id = ?
  `;
  try {
    const [result] = await conn
      .promise()
      .query(sql, [content, comment_id, user_id]);
    return result.affectedRows > 0; // 수정 성공 여부 반환
  } catch (err) {
    console.error("댓글 수정 오류:", err);
    return false; // 실패 시 false 반환
  } finally {
    await conn.end();
  }
};

// 내가 작성한 답글
exports.getMyComments = async (user_id) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  const sql = 
  `SELECT *
  FROM comment
  WHERE user_id = ?
  ORDER BY created_at DESC;`;
  const [rows] = await conn.promise().query(sql, [user_id]);
  await conn.end();
  return rows;
};