const dbconn = require("../config/dbconn");

exports.insertPostFile = async function ({ post_id, user_id, file_type, file_path }) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
    INSERT INTO post_file (post_id, user_id, file_type, file_path)
    VALUES (?, ?, ?, ?)
  `;

  try {
    //디버깅 테스트
    console.log('Executing query:', sql, [post_id, user_id, file_type, file_path]);
    await conn.promise().query(sql, [post_id, user_id, file_type, file_path]);
  } catch (err) {
    console.error("첨부파일 등록 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};
