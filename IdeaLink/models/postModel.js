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
  const conn = await dbconn.init(); // dbconn에서 커넥션 초기화
  await dbconn.connect(conn);

  const sql = `
    INSERT INTO post (
      user_id, title, summary, content, category_id, transaction_type, price
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    // 디버깅: 실행할 쿼리와 파라미터 출력
    console.log("Executing query:", sql, [
      user_id,
      title,
      summary,
      content,
      category_id,
      transaction_type,
      price,
    ]);

    // 쿼리 실행
    const [result] = await conn
      .promise()
      .query(sql, [
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
    console.error("게시글 등록 오류:", err); // 오류 출력
    throw err; // 오류를 호출한 곳으로 던짐
  } finally {
    // 커넥션 종료 (연결 후에는 꼭 종료해야 함)
    await conn.end();
  }
};

// post_id로 게시물 1개 조회
exports.selectOnePost = async function (post_id) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
    SELECT 
      p.*,
      u.nick_name,
      cs.name AS sub_name,
      cm.name AS main_name
    FROM 
      post p
    INNER JOIN 
      user u ON p.user_id = u.user_id
    INNER JOIN 
      category_sub cs ON p.category_id = cs.sub_id
    INNER JOIN 
      category_main cm ON cs.main_id = cm.main_id
    WHERE 
      p.post_id = ?`;

  try {
    const [rows] = await conn.promise().query(sql, [post_id]);
    return [rows][0];
  } catch (err) {
    console.error("게시글 조회 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};

// 답글 등록
exports.insertAnswer = async function ({
  post_id,
  answer_user_id,
  title,
  content,
}) {
  const conn = await dbconn.init(); // dbconn에서 커넥션 초기화
  await dbconn.connect(conn);

  const sql = `
    INSERT INTO ANSWER (
      post_id, user_id, title, content
    )
    VALUES (?, ?, ?, ?)
  `;

  try {
    // 디버깅: 실행할 쿼리와 파라미터 출력
    console.log("Executing query:", sql, [
      post_id,
      answer_user_id,
      title,
      content,
    ]);

    // 쿼리 실행
    const [result] = await conn
      .promise()
      .query(sql, [post_id, answer_user_id, title, content]);

    return result.insertId; // 새 게시글의 answer_id 반환
  } catch (err) {
    console.error("게시글 등록 오류:", err); // 오류 출력
    throw err; // 오류를 호출한 곳으로 던짐
  } finally {
    // 커넥션 종료 (연결 후에는 꼭 종료해야 함)
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