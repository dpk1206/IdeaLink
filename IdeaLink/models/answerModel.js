const dbconn = require("../config/dbconn");

// 답글 등록
exports.insertAnswer = async function ({
  post_id,
  answer_user_id,
  title,
  content,
  price,
}) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
    INSERT INTO answer (
      post_id, user_id, title, content, price
    )
    VALUES (?, ?, ?, ?, ?)
  `;

  try {
    console.log("Executing query:", sql, [
      post_id,
      answer_user_id,
      title,
      content,
      price,
    ]);

    const [result] = await conn
      .promise()
      .query(sql, [post_id, answer_user_id, title, content, price]);

    return result.insertId;
  } catch (err) {
    console.error("답글 등록 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};

// post_id로 답글 조회
exports.selectAnswer = async function (post_id) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
    SELECT 
      a.*,
      u.nick_name
    FROM
      answer a
    INNER JOIN
      user u ON a.user_id = u.user_id
    WHERE
      a.post_id = ?;`;

  try {
    const [rows] = await conn.promise().query(sql, [post_id]);
    return [rows][0];
  } catch (err) {
    console.error("답글 조회 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};

// 내가 작성한 답글
exports.getMyAnswers = async (user_id) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
    SELECT answer_id, post_id, title, created_at, price
    FROM answer
    WHERE user_id = ?
    ORDER BY created_at DESC;
  `;


  const [rows] = await conn.promise().query(sql, [user_id]);
  await conn.end();
  return rows;
};

exports.getAnswerById = async function (answer_id) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `SELECT * FROM answer WHERE answer_id = ?`;

  try {
    const [rows] = await conn.promise().query(sql, [answer_id]);
    return rows[0]; // 단일 객체 반환
  } catch (err) {
    console.error("답글 단건 조회 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};

exports.getAnswersByPostId = async function (post_id) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `SELECT * FROM answer WHERE post_id = ? ORDER BY created_at ASC`;

  try {
    const [rows] = await conn.promise().query(sql, [post_id]);
    return rows; // 전체 답변 리스트 반환
  } catch (err) {
    console.error("답글 목록 조회 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};

// 답글 상태 변경
exports.updateAnswerModerationStatus = async (answer_id, status) => {
  console.log("🟡 함수 진입 확인:", answer_id, status); // 반드시 찍혀야 함

  const conn = await dbconn.init();
  await conn.connect();

  try {
    const sql = `UPDATE answer SET moderation_status = ? WHERE answer_id = ?`;
    console.log("🧩 쿼리 실행 직전:", sql, [status, answer_id]);
    const [result] = await conn.promise().query(sql, [status, answer_id]);
    console.log("✅ 쿼리 실행 결과:", result);
    return result;
  } catch (err) {
    console.error("❌ 쿼리 실행 중 에러:", err); // ✨ 반드시 출력돼야 함
    throw err;
  } finally {
    await conn.end();
  }
};

