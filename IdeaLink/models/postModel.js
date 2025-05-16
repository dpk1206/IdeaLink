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
      user_id, title, summary, content, category_id, transaction_type, price
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    console.log("Executing query:", sql, [
      user_id,
      title,
      summary,
      content,
      category_id,
      transaction_type,
      price,
    ]);

    const [rows] = await conn
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

    console.log("insert 결과:", rows);
    return rows.insertId;
  } catch (err) {
    console.error("게시글 등록 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};


// post_id로 게시물 1개 조회
exports.selectOnePost = async function (post_id) {
  console.log("selectOnePost() 호출됨, post_id:", post_id);
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
      p.post_id = ?
  `;

  try {
    const [rows] = await conn.promise().query(sql, [post_id]);
    console.log("select 결과:", rows);
    return rows;
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

// 게시글 가져오기
exports.getPosts = async (limit, offset) => {
  console.log("getPosts 호출");
  const conn = await dbconn.init();
  
  try {
    await dbconn.connect(conn);  // DB 연결
    const sql = 'SELECT post_id, title, user_id, transaction_type, price, created_at FROM post ORDER BY created_at DESC LIMIT ? OFFSET ?';
    return await new Promise((resolve, reject) => {
      conn.query(sql, [limit, offset], (err, results) => {
        if (err) {
          console.error("Error occurred while fetching posts:", err);  // 오류 로그 출력
          return reject(err); // 오류를 reject로 전달
        }
        console.log("Fetched posts:", results);  // 쿼리 결과 확인
        resolve(results); // 결과 반환
      });
    });
  } catch (err) {
    console.error("Database connection error:", err);
    throw err;  // DB 연결 에러 발생 시 throw
  } finally {
    // DB 연결 종료
    conn.end();
  }
};

// 게시글 개수 가져오기
exports.getPostCount = async () => {
  const conn = await dbconn.init();
  
  try {
    await dbconn.connect(conn);  // DB 연결
    const sql = 'SELECT COUNT(*) AS total FROM post';
    return await new Promise((resolve, reject) => {
      conn.query(sql, (err, results) => {
        if (err) {
          console.error("Error occurred while fetching post count:", err);  // 오류 로그 출력
          return reject(err); // 오류를 reject로 전달
        }
        console.log("Total posts count:", results[0].total);  // 총 게시글 개수 확인
        resolve(results[0].total); // 총 개수 반환
      });
    });
  } catch (err) {
    console.error("Database connection error:", err);
    throw err;  // DB 연결 에러 발생 시 throw
  } finally {
    // DB 연결 종료
    conn.end();
  }
};


// ✅ 조건에 맞는 게시글 목록 가져오기
exports.getFilteredPosts = async ({ sub_id, main_id, fileTypes, transaction_type, keyword, search_type, sort_type, limit, offset }) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  let sql = `
    SELECT DISTINCT p.*, cs.name AS sub_name, cm.name AS main_name, u.nick_name
    FROM post p
    JOIN category_sub cs ON p.category_id = cs.sub_id
    JOIN category_main cm ON cs.main_id = cm.main_id
    LEFT JOIN post_file pf ON p.post_id = pf.post_id
    JOIN user u ON p.user_id = u.user_id
    WHERE 1=1
  `;
  const values = [];

  if (sub_id) {
    sql += " AND cs.sub_id = ?";
    values.push(sub_id);
  } else if (main_id) {
    sql += " AND cm.main_id = ?";
    values.push(main_id);
  }

  if (fileTypes && fileTypes.length > 0) {
    const placeholders = fileTypes.map(() => "?").join(",");
    sql += ` AND pf.file_type IN (${placeholders})`;
    values.push(...fileTypes);
  }

  if (transaction_type) {
    sql += " AND p.transaction_type = ?";
    values.push(transaction_type);
  }

  if (keyword && search_type === 'title') {
    sql += " AND p.title LIKE ?";
    values.push(`%${keyword}%`);
  } else if (keyword && search_type === 'author') {
    sql += " AND u.nick_name LIKE ?";
    values.push(`%${keyword}%`);
  }

  // 정렬 기준 분기 처리
if (sort_type === 'popular') {
  sql += " ORDER BY p.view_count DESC";
} else {
  sql += " ORDER BY p.created_at DESC"; // 기본값: 최신순
}

sql += " LIMIT ? OFFSET ?";
values.push(limit, offset);

  const [rows] = await conn.promise().query(sql, values);
  await conn.end();
  return rows;
};

// ✅ 조건에 맞는 게시글 총 개수 조회
exports.getFilteredPostCount = async ({ sub_id, main_id, fileTypes, transaction_type, keyword, search_type }) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  let sql = `
    SELECT COUNT(DISTINCT p.post_id) AS total
    FROM post p
    JOIN category_sub cs ON p.category_id = cs.sub_id
    JOIN category_main cm ON cs.main_id = cm.main_id
    LEFT JOIN post_file pf ON p.post_id = pf.post_id
    JOIN user u ON p.user_id = u.user_id
    WHERE 1=1
  `;
  const values = [];

  if (sub_id) {
    sql += " AND cs.sub_id = ?";
    values.push(sub_id);
  } else if (main_id) {
    sql += " AND cm.main_id = ?";
    values.push(main_id);
  }

  if (fileTypes && fileTypes.length > 0) {
    const placeholders = fileTypes.map(() => "?").join(",");
    sql += ` AND pf.file_type IN (${placeholders})`;
    values.push(...fileTypes);
  }

  if (transaction_type) {
    sql += " AND p.transaction_type = ?";
    values.push(transaction_type);
  }

  if (keyword && search_type === 'title') {
    sql += " AND p.title LIKE ?";
    values.push(`%${keyword}%`);
  } else if (keyword && search_type === 'author') {
    sql += " AND u.nick_name LIKE ?";
    values.push(`%${keyword}%`);
  }

  const [rows] = await conn.promise().query(sql, values);
  await conn.end();
  return rows[0]?.total ?? 0;
};


// 대분류 카테고리 매핑 가져오기
exports.getMainCategoryMap = async () => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `SELECT main_id, name FROM category_main`;
  const [rows] = await conn.promise().query(sql);

  await conn.end();

  const map = {};
  rows.forEach(row => {
    map[row.name] = row.main_id;
  });
  return map;
};

// 중분류 카테고리 매핑 가져오기
exports.getSubCategoryMap = async () => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `SELECT sub_id, name, main_id FROM category_sub`;
  const [rows] = await conn.promise().query(sql);

  await conn.end();

  const map = {};
  rows.forEach(row => {
    map[row.name] = {
      sub_id: row.sub_id,
      main_id: row.main_id
    };
  });
  return map;
};

//조회수증가
exports.increaseViewCount = async (post_id) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  await conn.promise().query(`
    UPDATE post SET view_count = view_count + 1 WHERE post_id = ?
  `, [post_id]);
  await conn.end();
};