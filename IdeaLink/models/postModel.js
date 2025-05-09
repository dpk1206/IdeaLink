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
  const conn = await dbconn.init();  // dbconn에서 커넥션 초기화
  const sql = `
    INSERT INTO post (
      user_id, title, summary, content, category_id, transaction_type, price
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    // 디버깅: 실행할 쿼리와 파라미터 출력
    console.log('Executing query:', sql, [
      user_id,
      title,
      summary,
      content,
      category_id,
      transaction_type,
      price,
    ]);

    // 쿼리 실행
    const [result] = await conn.promise().query(sql, [
      user_id,
      title,
      summary,
      content,
      category_id,
      transaction_type,
      price,
    ]);
    
    return result.insertId;  // 새 게시글의 post_id 반환
  } catch (err) {
    console.error("게시글 등록 오류:", err);  // 오류 출력
    throw err;  // 오류를 호출한 곳으로 던짐
  } finally {
    // 커넥션 종료 (연결 후에는 꼭 종료해야 함)
    await conn.end();
  }
};
