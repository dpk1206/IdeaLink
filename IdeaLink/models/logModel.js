const dbconn = require("../config/dbconn");

exports.insertUserLog = async function ({ user_id, user_log_event, user_log_ip }) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  const sql = `
    INSERT INTO user_log (user_id, user_log_event, user_log_ip)
    VALUES (?, ?, ?)
  `;
  try {
    await conn.promise().query(sql, [user_id, user_log_event, user_log_ip]);
  } catch (err) {
    console.error("로그 기록 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};
