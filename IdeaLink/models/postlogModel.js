const dbconn = require("../config/dbconn");

const postlogModel = {
  // 게시글 로그 삽입
  async createLog({ post_id, user_id, post_log_event, post_log_ip }) {
    const conn = await dbconn.init();
    await dbconn.connect(conn);

    const sql = `
      INSERT INTO post_log (post_id, user_id, post_log_event, post_log_ip)
      VALUES (?, ?, ?, ?)
    `;
    try {
      await conn.promise().query(sql, [post_id, user_id, post_log_event, post_log_ip]);
    } catch (err) {
      console.error("게시글 로그 기록 오류:", err);
      throw err;
    } finally {
      await conn.end();
    }
  },

  // 특정 게시물 로그 전체 조회
  async getLogsByPostId(post_id) {
    const conn = await dbconn.init();
    await dbconn.connect(conn);

    const sql = `SELECT * FROM post_log WHERE post_id = ? ORDER BtY post_log_time DESC`;
    try {
      const [rows] = await conn.promise().query(sql, [post_id]);
      return rows;
    } catch (err) {
      console.error("post_id 로그 조회 오류:", err);
      throw err;
    } finally {
      await conn.end();
    }
  },

  // 특정 유저의 로그 조회
  async getLogsByUserId(user_id) {
    const conn = await dbconn.init();
    await dbconn.connect(conn);

    const sql = `SELECT * FROM post_log WHERE user_id = ? ORDER BY post_log_time DESC`;
    try {
      const [rows] = await conn.promise().query(sql, [user_id]);
      return rows;
    } catch (err) {
      console.error("user_id 로그 조회 오류:", err);
      throw err;
    } finally {
      await conn.end();
    }
  }
};

module.exports = postlogModel;
