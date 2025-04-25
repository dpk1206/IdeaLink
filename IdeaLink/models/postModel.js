const dbconn = require("../config/dbconn");

exports.insertPost = async function ({
  user_id,
  title,
  summary,
  content,
  category_id,
  transaction_type,
  price,
}) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
    INSERT INTO post (
      user_id, title, summary, content,category_id, transaction_type, price
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    //디버깅 테스트
    console.log('Executing query:', sql, [
      user_id,
      title,
      summary,
      content,
      category_id,
      transaction_type,
      price,
    ]);
    const [result] = await conn.promise().query(sql, [
      user_id,
      title,
      summary,
      content,
      category_id,
      transaction_type,
      price,
    ]);
    return result.insertId; // 새 게시글의 post_id 반환
  } catch (err) {
    console.error("게시글 등록 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};
