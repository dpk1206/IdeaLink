const dbconn = require("../config/dbconn");

exports.insertSuggestion = async (user_id, content, post_id = null, answer_id = null) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
    INSERT INTO suggestion (user_id, content, post_id, answer_id)
    VALUES (?, ?, ?, ?)
  `;
  await conn.promise().query(sql, [user_id, content, post_id, answer_id]);
  await conn.end();
};
exports.getSuggestionsByUserId = async (user_id) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
    SELECT 
      suggestion_id, content, post_id, answer_id, created_at,
      reply_content, reply_at
    FROM suggestion 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `;

  const [rows] = await conn.promise().query(sql, [user_id]);
  await conn.end();
  return rows;
};

