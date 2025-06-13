const dbconn = require("../config/dbconn");

// 게시글을 데이터베이스에 등록합니다.
exports.insertPost = async function ({
  user_id,
  title,
  summary,
  content,
  category_id,
  status,
  price,
}) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
    INSERT INTO post (
      user_id, title, summary, content, category_id, status, price
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
      status,
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
        status,
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
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
      SELECT 
      p.*,
      u.nick_name,
      cs.name AS sub_name,
      cm.name AS main_name,
      a.answer_id AS selected_answer_id,
      a.title AS selected_answer_title,
      a.content AS selected_answer_content,
      a.user_id AS selected_answer_user_id
    FROM 
      post p
    INNER JOIN 
      user u ON p.user_id = u.user_id
    INNER JOIN 
      category_sub cs ON p.category_id = cs.sub_id
    INNER JOIN 
      category_main cm ON cs.main_id = cm.main_id
    LEFT JOIN
      answer a ON p.selected_answer_id = a.answer_id
    WHERE 
      p.post_id = ?
  `;

  try {
    const [rows] = await conn.promise().query(sql, [post_id]);
    console.log("select 결과:", rows);
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error("게시글 조회 오류:", err);
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
    await dbconn.connect(conn); // DB 연결
    const sql =
      "SELECT post_id, title, user_id, status, price, created_at FROM post ORDER BY created_at DESC LIMIT ? OFFSET ?";
    return await new Promise((resolve, reject) => {
      conn.query(sql, [limit, offset], (err, results) => {
        if (err) {
          console.error("Error occurred while fetching posts:", err); // 오류 로그 출력
          return reject(err); // 오류를 reject로 전달
        }
        console.log("Fetched posts:", results); // 쿼리 결과 확인
        resolve(results); // 결과 반환
      });
    });
  } catch (err) {
    console.error("Database connection error:", err);
    throw err; // DB 연결 에러 발생 시 throw
  } finally {
    // DB 연결 종료
    conn.end();
  }
};

// 게시글 개수 가져오기
exports.getPostCount = async () => {
  const conn = await dbconn.init();

  try {
    await dbconn.connect(conn); // DB 연결
    const sql = "SELECT COUNT(*) AS total FROM post";
    return await new Promise((resolve, reject) => {
      conn.query(sql, (err, results) => {
        if (err) {
          console.error("Error occurred while fetching post count:", err); // 오류 로그 출력
          return reject(err); // 오류를 reject로 전달
        }
        console.log("Total posts count:", results[0].total); // 총 게시글 개수 확인
        resolve(results[0].total); // 총 개수 반환
      });
    });
  } catch (err) {
    console.error("Database connection error:", err);
    throw err; // DB 연결 에러 발생 시 throw
  } finally {
    // DB 연결 종료
    conn.end();
  }
};

// ✅ 조건에 맞는 게시글 목록 가져오기
exports.getFilteredPosts = async ({
  sub_id,
  main_id,
  fileTypes,
  status,
  keyword,
  search_type,
  sort_type,
  limit,
  offset,
}) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  let sql = `
  SELECT DISTINCT 
    p.*, 
    cs.name AS sub_name, 
    cm.name AS main_name, 
    u.nick_name,
    (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.post_id) AS like_count
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

  if (status) {
    sql += " AND p.status = ?";
    values.push(status);
  }

  if (keyword && search_type === "title") {
    sql += " AND p.title LIKE ?";
    values.push(`%${keyword}%`);
  } else if (keyword && search_type === "author") {
    sql += " AND u.nick_name LIKE ?";
    values.push(`%${keyword}%`);
  }

  // 정렬 기준 분기 처리
  if (sort_type === "popular") {
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
exports.getFilteredPostCount = async ({
  sub_id,
  main_id,
  fileTypes,
  status,
  keyword,
  search_type,
}) => {
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

  if (status) {
    sql += " AND p.status = ?";
    values.push(status);
  }

  if (keyword && search_type === "title") {
    sql += " AND p.title LIKE ?";
    values.push(`%${keyword}%`);
  } else if (keyword && search_type === "author") {
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
  rows.forEach((row) => {
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
  rows.forEach((row) => {
    map[row.name] = {
      sub_id: row.sub_id,
      main_id: row.main_id,
    };
  });
  return map;
};

//조회수증가
exports.increaseViewCount = async (post_id) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  await conn.promise().query(
    `
    UPDATE post SET view_count = view_count + 1 WHERE post_id = ?
  `,
    [post_id]
  );
  await conn.end();
};

// 최근 게시글 5개
exports.getRecentPosts = async () => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  const sql = `SELECT post_id, title FROM post ORDER BY created_at DESC LIMIT 5`;
  const [rows] = await conn.promise().query(sql);
  await conn.end();
  return rows;
};

// 인기 게시글 5개
exports.getPopularPosts = async () => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  const sql = `SELECT post_id, title FROM post ORDER BY view_count DESC LIMIT 5`;
  const [rows] = await conn.promise().query(sql);
  await conn.end();
  return rows;
};

// 내가 작성한 게시글
exports.getMyPosts = async (user_id) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  const sql = 
  `SELECT 
  p.post_id, 
  p.title, 
  p.created_at, 
  p.view_count, 
  p.status, 
  p.price,
  (
    SELECT COUNT(*) 
    FROM post_likes pl 
    WHERE pl.post_id = p.post_id
  ) AS like_count
  FROM post p
  WHERE p.user_id = ?
  ORDER BY p.created_at DESC;`;
  const [rows] = await conn.promise().query(sql, [user_id]);
  await conn.end();
  return rows;
};


// 아이디어 가격 조회 + 구매자 ID 포함
exports.getPostPrice = async (post_id) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  try {
    const [rows] = await conn.promise().query(
      "SELECT price, user_id, status , buyer_id FROM post WHERE post_id = ?",
      [post_id]
    );
    return rows[0]; // { price, user_id, buyer_id }
  } catch (err) {
    console.error("getPostPrice 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};



// 구매 로그 삽입
exports.insertPurchaseLog = async (user_id, post_id, price) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  try {
    await conn.promise().query(
      "INSERT INTO purchase_log (user_id, post_id, price) VALUES (?, ?, ?)",
      [user_id, post_id, price]
    );
  } catch (err) {
    console.error("insertPurchaseLog 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};
//상태변경함수
exports.updatePostStatus = async (post_id, status) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  try {
    await conn.promise().query(
      "UPDATE post SET status = ? WHERE post_id = ?",
      [status, post_id]
    );
  } catch (err) {
    console.error("게시물 상태 업데이트 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};

// 거래 요청한 구매자 정보 저장
exports.setBuyer = async (post_id, buyer_id) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  try {
    await conn.promise().query(
      "UPDATE post SET buyer_id = ? WHERE post_id = ?",
      [buyer_id, post_id]
    );
  } catch (err) {
    console.error("setBuyer 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};
// 거래 내역 조회
exports.getTradeHistory = async function (user_id) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
    SELECT 
      p.post_id,
      p.title,
      p.price,
      p.created_at AS date,
      CASE
        WHEN p.user_id = ? THEN '판매'
        WHEN p.buyer_id = ? THEN '구매'
        ELSE '기타'
      END AS type,
      CASE
        WHEN p.selected_answer_id IS NULL THEN '직거래'
        ELSE '답글거래'
      END AS method
    FROM post p
    WHERE p.status = '거래완료'
      AND (p.user_id = ? OR p.buyer_id = ?)
    ORDER BY p.created_at DESC
  `;

  const [rows] = await conn.promise().query(sql, [user_id, user_id, user_id, user_id]);
  await conn.end();
  return rows;
};


// ✅ 마이페이지: 내가 작성한 글 목록
exports.getMyPostsByUserId = async function (user_id) {
  const conn = await dbconn.init();
  await conn.connect();

  const sql = `
    SELECT 
      p.post_id,
      p.title,
      p.price,
      p.created_at,
      p.view_count,
      p.status,
      p.selected_answer_id,  -- ✅ 반드시 필요
      p.user_id,
      (
        SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.post_id
      ) AS like_count  -- ✅ 그룹 없이 별도 카운트
    FROM post p
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
  `;

  const [rows] = await conn.promise().query(sql, [user_id]);
  await conn.end();
  return rows;
};



// 마이페이지,일반판매게시글 구매 요청청
exports.getRequestedDirectPosts = async (user_id) => {
  const conn = await dbconn.init();
  await conn.connect();

  const sql = `
   SELECT 
  p.post_id, p.title, p.price, p.status, p.created_at, u.nick_name
FROM post p
JOIN user u ON p.user_id = u.user_id
WHERE p.buyer_id = ? 
  AND p.selected_answer_id IS NULL
ORDER BY p.created_at DESC

  `;
  const [rows] = await conn.promise().query(sql, [user_id]);
  await conn.end();
  return rows;
};
// 마이페이지,답글 구매 요청
exports.getRequestedAnswerPosts = async (user_id) => {
  const conn = await dbconn.init();
  await conn.connect();

  const sql = `
    SELECT 
  p.post_id, p.title, p.price, p.status, p.created_at, u.nick_name
FROM post p
JOIN answer a ON p.selected_answer_id = a.answer_id
JOIN user u ON a.user_id = u.user_id
WHERE p.buyer_id = ?
  AND p.selected_answer_id IS NOT NULL
ORDER BY p.created_at DESC

  `;
  const [rows] = await conn.promise().query(sql, [user_id]);
  await conn.end();
  return rows;
};

// 답글 기반 게시글 거래 상태를 '거래중'으로 설정 + 구매자와 선택된 답변 ID 기록
async function markAnswerPending(post_id, buyer_id, answer_id) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
    UPDATE post 
    SET status = '거래중', buyer_id = ?, selected_answer_id = ?
    WHERE post_id = ?
  `;

  try {
    await conn.promise().query(sql, [buyer_id, answer_id, post_id]);
  } catch (err) {
    console.error("markAnswerPending 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
}
exports.markAnswerPending = markAnswerPending;

// 답글 기반 게시글 거래를 '거래완료'로 상태 변경
async function markAnswerDealComplete(post_id) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
    UPDATE post
    SET status = '거래완료'
    WHERE post_id = ?
  `;

  try {
    await conn.promise().query(sql, [post_id]);
  } catch (err) {
    console.error("markAnswerDealComplete 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
}
exports.markAnswerDealComplete = markAnswerDealComplete;

// post_id로 게시글 전체 정보 조회 (관리용 or 상태 확인용 등에서 사용 가능)
exports.getPostById = async function(post_id) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `SELECT * FROM post WHERE post_id = ?`;

  try {
    const [rows] = await conn.promise().query(sql, [post_id]);
    return rows[0];
  } catch (err) {
    console.error("getPostById 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};

// 일반 판매글에 대해 구매요청
async function markDirectPostPending(post_id, buyer_id) {
  const conn = await dbconn.init();
  await conn.connect();

  const sql = `
    UPDATE post 
    SET status = '거래중', buyer_id = ?
    WHERE post_id = ? AND selected_answer_id IS NULL
  `;

  try {
    await conn.promise().query(sql, [buyer_id, post_id]);
  } catch (err) {
    console.error("markDirectPostPending 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
}
exports.markDirectPostPending = markDirectPostPending;

