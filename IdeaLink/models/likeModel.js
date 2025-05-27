const dbconn = require("../config/dbconn");

// 좋아요 중복 확인
exports.hasUserLiked = async function (user_id, post_id) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  try {
    const sql = `
      SELECT 1 
      FROM post_likes 
      WHERE user_id = ? AND post_id = ?
    `;
    const [rows] = await conn.promise().query(sql, [user_id, post_id]);
    return rows.length > 0;
  } catch (err) {
    console.error("hasUserLiked 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};

// 좋아요 저장
exports.saveLike = async function (user_id, post_id) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  try {
    const sql = `
      INSERT INTO post_likes (user_id, post_id) 
      VALUES (?, ?)
    `;
    await conn.promise().query(sql, [user_id, post_id]);
  } catch (err) {
    console.error("saveLike 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};

// 좋아요 수 조회
exports.getLikeCount = async function (post_id) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  try {
    const sql = `
      SELECT COUNT(*) AS count 
      FROM post_likes 
      WHERE post_id = ?
    `;
    const [[row]] = await conn.promise().query(sql, [post_id]);
    return row.count;
  } catch (err) {
    console.error("getLikeCount 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};
