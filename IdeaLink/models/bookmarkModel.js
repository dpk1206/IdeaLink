const dbconn = require("../config/dbconn");

/**
 * 북마크를 등록
 * 이미 등록된 경우 중복 에러를 처리
 *
 * @param {number} user_id - 북마크를 등록할 사용자 ID
 * @param {number} post_id - 북마크할 게시글 ID
 * @returns {Promise<{success: boolean, message?: string}>}
 *          성공 여부와(중복 시 메시지 포함) 결과를 반환합니다.
 * @throws {Error} 기타 데이터베이스 오류 발생 시 예외를 throw합니다.
 */
async function insertBookmark(user_id, post_id) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  const sql = "INSERT INTO bookmark (user_id, post_id) VALUES (?, ?)";
  try {
    await conn.promise().query(sql, [user_id, post_id]);
    return { success: true };
  } catch (err) {
    // 이미 등록된 경우 등 중복 에러 처리
    if (err.code === "ER_DUP_ENTRY") {
      return { success: false, message: "이미 북마크에 등록됨" };
    }
    throw err;
  }
}

/**
 * 북마크를 해제(삭제)
 *
 * @param {number} user_id - 북마크를 해제할 사용자 ID
 * @param {number} post_id - 북마크를 해제할 게시글 ID
 * @returns {Promise<{success: boolean}>}
 *          성공 여부를 반환합니다.
 * @throws {Error} 데이터베이스 오류 발생 시 예외를 throw합니다.
 */
async function deleteBookmark(user_id, post_id) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  const sql = "DELETE FROM bookmark WHERE user_id = ? AND post_id = ?";
  const [result] = await conn.promise().query(sql, [user_id, post_id]);
  return { success: result.affectedRows > 0 };
}

/**
 * 해당 유저가 해당 게시물을 북마크했는지 여부를 boolean으로 반환
 * @param {number} user_id
 * @param {number} post_id
 * @returns {Promise<boolean>}
 */
async function isBookmarked(user_id, post_id) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  const sql =
    "SELECT 1 FROM bookmark WHERE user_id = ? AND post_id = ? LIMIT 1";
  const [rows] = await conn.promise().query(sql, [user_id, post_id]);
  return rows.length > 0;
}

/**
 * 유저의 모든 북마크 정보를 조회
 *
 * @param {number} user_id - 조회할 유저 ID
 * @returns {Promise<Array>} 북마크 객체 배열을 반환
 * @throws {Error} 데이터베이스 조회 중 오류 발생 시 예외를 throw
 */
async function getUserBookmarks(user_id) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  const sql = `
  SELECT
    b.bookmark_id,
    b.created_at AS bookmark_created_at,
    p.post_id,
    p.title,
    p.view_count,
    p.transaction_type,
    p.created_at,
    u.nick_name
  FROM   
    bookmark b
    JOIN post p ON b.post_id = p.post_id
    JOIN user u ON p.user_id = u.user_id
  WHERE
    b.user_id = ?
  ORDER BY
    b.bookmark_id DESC `;
  try {
    const [rows] = await conn.promise().query(sql, [user_id]);
    return rows;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  insertBookmark,
  deleteBookmark,
  isBookmarked,
  getUserBookmarks,
};
