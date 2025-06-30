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
exports.selectOnePost = async function (post_id, user_type, user_id) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  let sql = `
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
  const values = [post_id];

  // 관리자 외 유저는 숨김글 접근 제한 (본인 글만 예외)
  if (user_type !== 'admin') {
    sql += " AND (p.status != '숨김' OR p.user_id = ?)";
    values.push(user_id);
  }

  try {
    const [rows] = await conn.promise().query(sql, values);
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error("게시글 조회 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};

// 게시글 가져오기
exports.getPosts = async (limit, offset, user_type) => {
  console.log("getPosts 호출");
  const conn = await dbconn.init();
  
  try {
    await dbconn.connect(conn);

    let sql = `
      SELECT post_id, title, user_id, status, price, created_at
      FROM post
      WHERE 1=1
    `;
    const values = [];

    if (user_type !== 'admin') {
      sql += " AND status != '숨김'";
    }

    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    values.push(limit, offset);

    // 프로미스 기반 쿼리 실행
    const [results] = await conn.promise().query(sql, values);
    return results;

  } catch (err) {
    console.error("게시글 조회 오류:", err);
    throw err; // 호출한 측에서 오류 처리할 수 있도록 전파
  } finally {
    // 반드시 연결 종료 (성공/실패 여부 무관)
    if (conn) await conn.end().catch(e => console.error("연결 종료 오류:", e));
  }
};

// 게시글 개수 가져오기
exports.getPostCount = async (user_type) => {
  const conn = await dbconn.init();
  
  try {
    await dbconn.connect(conn);

    let sql = "SELECT COUNT(*) AS total FROM post WHERE 1=1";
    const values = [];

    if (user_type !== 'admin') {
      sql += " AND status != '숨김'";
    }

    // 프로미스 기반 쿼리 실행
    const [results] = await conn.promise().query(sql, values);
    return results[0].total;

  } catch (err) {
    console.error("게시글 개수 조회 오류:", err);
    throw err; // 오류 전파
  } finally {
    // 반드시 연결 종료
    if (conn) await conn.end().catch(e => console.error("연결 종료 오류:", e));
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
  user_type,
  user_id, // ← 일반 유저일 경우 본인 글 예외 허용
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

  // 👉 숨김 상태 필터링 (관리자는 제외)
  if (user_type !== 'admin') {
    sql += " AND (p.status != '숨김' OR p.user_id = ?)";
    values.push(user_id);
  }

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
    sql += " AND (p.title LIKE ? OR p.summary LIKE ?)";
    values.push(`%${keyword}%`, `%${keyword}%`);
  } else if (keyword && search_type === "author") {
    sql += " AND u.nick_name LIKE ?";
    values.push(`%${keyword}%`);
  }

  sql += sort_type === "popular"
    ? " ORDER BY p.view_count DESC"
    : " ORDER BY p.created_at DESC";

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
  user_type,
  user_id,
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

  if (user_type !== 'admin') {
    sql += " AND (p.status != '숨김' OR p.user_id = ?)";
    values.push(user_id);
  }

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
    sql += " AND (p.title LIKE ? OR p.summary LIKE ?)";
    values.push(`%${keyword}%`, `%${keyword}%`);
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
      "SELECT title, price, user_id, status , buyer_id FROM post WHERE post_id = ?",
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

// 상태변경함수 + updated_at 동시 갱신
exports.updatePostStatus = async (post_id, status) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  try {
    await conn.promise().query(
      "UPDATE post SET status = ?, updated_at = NOW() WHERE post_id = ?",
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
  COALESCE(pr.proposed_price, p.price) AS request_price,
  p.created_at AS date,
  CASE
    -- 너가 구매자면 구매
    WHEN pr.buyer_id = ? THEN '구매'
    -- 너가 판매자면 판매 (답글 기반 거래)
    WHEN pr.seller_id = ? THEN '판매'
    -- 일반 게시글 거래에서 너가 글쓴이면 판매자
    WHEN p.user_id = ? THEN '판매'
    ELSE '기타'
  END AS type,
  CASE
    WHEN p.selected_answer_id IS NULL THEN '직거래'
    ELSE '답글거래'
  END AS method
FROM post p
LEFT JOIN purchase_request pr
  ON p.post_id = pr.post_id AND pr.status = '수락됨'
WHERE p.status = '거래완료'
  AND (
    pr.buyer_id = ? OR pr.seller_id = ? OR p.user_id = ?
  )
ORDER BY p.created_at DESC
  `;

  const [rows] = await conn.promise().query(sql, [
    user_id, user_id, user_id,  // CASE
    user_id, user_id, user_id   // WHERE
  ]);

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
    p.selected_answer_id,
    p.user_id,
    pr.proposed_price AS request_price,
    pr.status AS request_status,
    u2.nick_name AS buyer_nick,
    (
      SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.post_id
    ) AS like_count
  FROM post p
  LEFT JOIN (
    SELECT pr1.*
    FROM purchase_request pr1
    INNER JOIN (
      SELECT post_id, MAX(created_at) AS latest_created
      FROM purchase_request
      GROUP BY post_id
    ) pr2 ON pr1.post_id = pr2.post_id AND pr1.created_at = pr2.latest_created
  ) pr ON p.post_id = pr.post_id
  LEFT JOIN user u2 ON pr.buyer_id = u2.user_id
  WHERE p.user_id = ?
  ORDER BY p.created_at DESC
  `;

  const [rows] = await conn.promise().query(sql, [user_id]);
  await conn.end();
  return rows;
};

// 마이페이지 - 답글 기반 구매 요청 목록
exports.getRequestedAnswerPosts = async (user_id) => {
  const conn = await dbconn.init();
  await conn.connect();

  const sql = `
    SELECT 
      pr.post_id,
      p.title AS post_title,
      a.title AS answer_title,
      u.nick_name,
      pr.proposed_price,
      pr.status AS request_status,
      pr.created_at
    FROM purchase_request pr
    JOIN post p ON pr.post_id = p.post_id
    JOIN answer a ON pr.answer_id = a.answer_id
    JOIN user u ON pr.seller_id = u.user_id
    WHERE pr.buyer_id = ? AND pr.answer_id IS NOT NULL
    ORDER BY pr.created_at DESC
  `;

  const [rows] = await conn.promise().query(sql, [user_id]);
  await conn.end();
  return rows;
};

// 마이페이지 - 일반 판매 게시글 구매 요청 목록
exports.getRequestedDirectPosts = async (user_id) => {
  const conn = await dbconn.init();
  await conn.connect();

  const sql = `
    SELECT 
      p.post_id,
      p.title,
      p.price,
      p.created_at,
      pr.proposed_price,
      pr.status AS request_status,
      u.nick_name
    FROM purchase_request pr
    JOIN post p ON pr.post_id = p.post_id
    JOIN user u ON pr.seller_id = u.user_id
    WHERE pr.buyer_id = ?
      AND pr.answer_id IS NULL
    ORDER BY pr.created_at DESC
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

// 답글 기반 게시글 거래를 '거래완료'로 상태 변경하면서 updated_at도 갱신
async function markAnswerDealComplete(post_id) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
    UPDATE post
    SET status = '거래완료',
        updated_at = NOW()
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
exports.getPostById = async function (post_id) {
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

// 구매 요청을 purchase_request 테이블에 삽입
exports.insertPurchaseRequest = async ({ post_id, answer_id = null, buyer_id, seller_id, proposed_price }) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  try {
    await conn.promise().query(`
      INSERT INTO purchase_request (post_id, answer_id, buyer_id, seller_id, proposed_price)
      VALUES (?, ?, ?, ?, ?)
    `, [post_id, answer_id, buyer_id, seller_id, proposed_price]);
  } catch (err) {
    console.error("❌ purchase_request INSERT 실패:", err);
    throw err;
  } finally {
    await conn.end();
  }
};

// post_id 기준으로 가장 최근 '대기중' 구매 요청 1건 조회
exports.getActivePurchaseRequest = async (post_id) => {
  const conn = await dbconn.init();
  await conn.connect();

  const sql = `
    SELECT * FROM purchase_request
    WHERE post_id = ?
      AND status = '대기중'
    ORDER BY created_at DESC
    LIMIT 1
  `;

  try {
    const [rows] = await conn.promise().query(sql, [post_id]);
    return rows[0];
  } catch (err) {
    console.error("getActivePurchaseRequest 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};

// purchase_request여기에서 구매 요청을 수락 상태로 변경
exports.markRequestAccepted = async (post_id) => {
  const conn = await dbconn.init();
  await conn.connect();

  const sql = `
    UPDATE purchase_request
    SET status = '수락됨'
    WHERE post_id = ? AND status = '대기중'
  `;

  try {
    await conn.promise().query(sql, [post_id]);
  } catch (err) {
    console.error("markRequestAccepted 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};

// post_id 기준으로 가장 최근 대기중 요청을 거절 상태로 변경
exports.rejectPurchaseRequest = async (post_id) => {
  const conn = await dbconn.init();
  await conn.connect();

  const sql = `
    UPDATE purchase_request
    SET status = '거절됨'
    WHERE post_id = ?
      AND status = '대기중'
  `;

  try {
    await conn.promise().query(sql, [post_id]);
  } catch (err) {
    console.error("rejectPurchaseRequest 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};

// 답글 구매 요청에 대한 가격 조회
exports.getPurchaseRequestByAnswerId = async (answer_id) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
    SELECT pr.*, u.nick_name AS buyer_nick
    FROM purchase_request pr
    LEFT JOIN user u ON pr.buyer_id = u.user_id
    WHERE pr.answer_id = ?
    LIMIT 1
  `;

  const [rows] = await conn.promise().query(sql, [answer_id]);
  await conn.end();
  return rows[0]; // 하나만 가져오니까
};

// 답변 거래 거절 처리 (구매 요청 취소)
exports.cancelAnswerPurchase = async (post_id, answer_id) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  try {
    // 구매 요청 삭제
    const deleteSql = `DELETE FROM purchase_request WHERE post_id = ? AND answer_id = ?`;
    await conn.promise().query(deleteSql, [post_id, answer_id]);

    // 게시글 상태를 '구매'로 되돌림
    const updateSql = `UPDATE post SET status = '구매', buyer_id = NULL WHERE post_id = ?`;
    await conn.promise().query(updateSql, [post_id]);

    await conn.end();
    return true;
  } catch (err) {
    console.error("cancelAnswerPurchase 오류:", err);
    await conn.end();
    return false;
  }
};

// 답글 구매 요청 수락 처리 (거래 완료)
exports.markPurchaseRequestAccepted = async (answer_id) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  try {
    const sql = `UPDATE purchase_request SET status = '수락됨' WHERE answer_id = ?`;
    await conn.promise().query(sql, [answer_id]);
    await conn.end();
  } catch (err) {
    console.error("거래 요청 상태 업데이트 오류:", err);
    await conn.end();
    throw err;
  }
};

// 답글 채택 (관리자 보상용)
exports.markAnswerAsSelected = async (post_id, answer_id) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  try {
    // selected_answer_id만 등록 (게시글 상태 변경 ❌)
    const updatePost = `
      UPDATE post
      SET selected_answer_id = ?
      WHERE post_id = ?
    `;
    await conn.promise().query(updatePost, [answer_id, post_id]);

    // 다른 답변 미채택으로 초기화
    const resetOthers = `
      UPDATE answer
      SET status = '미채택'
      WHERE post_id = ? AND answer_id != ?
    `;
    await conn.promise().query(resetOthers, [post_id, answer_id]);

    // 선택된 답변 채택 처리
    const markSelected = `
      UPDATE answer
      SET status = '채택됨'
      WHERE answer_id = ?
    `;
    await conn.promise().query(markSelected, [answer_id]);

    await conn.end();
    return true;
  } catch (err) {
    console.error("markAnswerAsSelected error:", err);
    await conn.end();
    return false;
  }
};

// 관리자가 상태변경에 따른 사유 moderation_logs 테이블에 로그 삽입
exports.insertModerationLog = async function ({ target_type, target_id, status, reason, admin_id }) {
  const conn = await dbconn.init();
  await conn.connect();

  const sql = `
    INSERT INTO moderation_logs (target_type, target_id, status, reason, admin_id)
    VALUES (?, ?, ?, ?, ?)
  `;

  try {
    const [result] = await conn.promise().query(sql, [target_type, target_id, status, reason, admin_id]);
    return result.insertId;
  } catch (err) {
    console.error('Moderation 로그 삽입 오류:', err);
    throw err;
  } finally {
    await conn.end();
  }
};

// 상태에 따른 사유 보기
exports.getModerationLogsByTarget = async (target_type, target_id) => {
  const conn = await dbconn.init();
  try {
    await conn.connect();
    const sql = `
      SELECT reason, status, created_at
      FROM moderation_logs
      WHERE target_type = ? AND target_id = ?
      ORDER BY created_at DESC
    `;
    const [rows] = await conn.promise().query(sql, [target_type, target_id]);
    return rows;
  } catch (error) {
    console.error('Error in getModerationLogsByTarget:', error);
    throw error;
  } finally {
    await conn.end();
  }
};

// 인기 아이디어 상위 4개 가져오기 (조회수 기준)
exports.getTop4Ideas = async () => {
  const conn = await dbconn.init();
  try {
    await conn.connect();
    const sql = `
     SELECT 
       p.*,
       pf.saved_name,
       pf.file_path
     FROM post p
     LEFT JOIN (
       SELECT *
       FROM post_file
       WHERE post_type = 'post'
       AND file_type IN ('.jpg', '.png', '.jpeg')
       GROUP BY post_id
     ) pf ON p.post_id = pf.post_id
     WHERE p.status IN ('판매','구매')
     ORDER BY p.view_count DESC
     LIMIT 4;
    `;
    const [rows] = await conn.promise().query(sql);
    // 각 row의 user_id를 기반으로 nickname 조회 및 병합
    const userModel = require("../models/userModel");
    const rowsWithNicknames = await Promise.all(
      rows.map(async (row) => {
        const user = await userModel.getUserById(row.user_id);
        return {
          ...row,
          nick_name: user?.nick_name || null,
        };
      })
    );
    return rowsWithNicknames;
  } catch (error) {
    console.error('Error in getTop4Ideas:', error);
    throw error;
  } finally {
    await conn.end();
  }
};