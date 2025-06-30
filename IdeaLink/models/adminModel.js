const dbconn = require('../config/dbconn');

// 전체 게시글 + 답글 함께 조회 (숨김 포함)
exports.getAllPostsWithAnswers = async () => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  try {
    // 게시글 목록
    const [posts] = await conn.promise().query(`
      SELECT p.*, u.nick_name
      FROM post p
      LEFT JOIN user u ON p.user_id = u.user_id
      ORDER BY p.created_at DESC
    `);

    // 각 게시글의 답글 목록 추가
    for (let post of posts) {
      const postId = post.post_id;
      if (!postId) continue;

      const [answers] = await conn.promise().query(`
        SELECT a.*, u.nick_name
        FROM answer a
        LEFT JOIN user u ON a.user_id = u.user_id
        WHERE a.post_id = ?
        ORDER BY a.created_at ASC
      `, [postId]);

      post.answers = answers;
    }

    return posts;
  } finally {
    await conn.end();
  }
};

// 공지사항 목록 조회
exports.getNotices = async () => {
  const conn = await dbconn.init(); await dbconn.connect(conn);
  const [rows] = await conn.promise().query(`SELECT * FROM notice ORDER BY created_at DESC`);
  await conn.end();
  return rows;
};

// 공지사항 등록
exports.insertNotice = async (title, content) => {
  const conn = await dbconn.init(); await dbconn.connect(conn);
  await conn.promise().query(`INSERT INTO notice (title, content) VALUES (?, ?)`, [title, content]);
  await conn.end();
};

// 공지사항 수정
exports.updateNotice = async (id, title, content) => {
  const conn = await dbconn.init(); await dbconn.connect(conn);
  await conn.promise().query(`UPDATE notice SET title=?, content=? WHERE notice_id=?`, [title, content, id]);
  await conn.end();
};

// 공지사항 삭제
exports.deleteNotice = async (id) => {
  const conn = await dbconn.init(); await dbconn.connect(conn);
  await conn.promise().query(`DELETE FROM notice WHERE notice_id=?`, [id]);
  await conn.end();
};
// 최신 공지사항 3개 가져오기
exports.getRecentNotices = async () => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
    SELECT notice_id, title, content, DATE_FORMAT(created_at, '%Y.%m.%d') as formatted_date
    FROM notice
    ORDER BY created_at DESC
    LIMIT 3
  `;
  const [rows] = await conn.promise().query(sql);
  await conn.end();
  return rows;
};

// 총 수익 (플랫폼 수수료)
exports.getTotalPlatformFee = async () => {
  const conn = await dbconn.init();
  await conn.connect();

  const [rows] = await conn.promise().query(`
    SELECT SUM(amount) AS total_fee
    FROM point_log
    WHERE type = 'platform_fee'
  `);

  await conn.end();
  return rows[0]?.total_fee || 0;
};

// 월별 수익
exports.getMonthlyFeeStats = async () => {
  const conn = await dbconn.init();
  await conn.connect();

  const [rows] = await conn.promise().query(`
    SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, SUM(amount) AS income
    FROM point_log
    WHERE type = 'platform_fee'
    GROUP BY month
    ORDER BY month DESC
  `);

  await conn.end();
  return rows;
};

exports.getMonthlyTradeStats = async () => {
  const conn = await dbconn.init();
  await conn.connect();

  try {
    // 거래 요청 수
    const [requestRows] = await conn.promise().query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
             COUNT(*) AS total
      FROM purchase_request
      GROUP BY month
    `);

    // 거래 완료 수
    const [completeRows] = await conn.promise().query(`
      SELECT DATE_FORMAT(updated_at, '%Y-%m') AS month,
             COUNT(*) AS done
      FROM post
      WHERE status = '거래완료'
      GROUP BY month
    `);

    // 병합
    const statsMap = {};

    requestRows.forEach(row => {
      statsMap[row.month] = {
        month: row.month,
        total: row.total,
        done: 0
      };
    });

    completeRows.forEach(row => {
      if (statsMap[row.month]) {
        statsMap[row.month].done = row.done;
      } else {
        statsMap[row.month] = {
          month: row.month,
          total: 0,
          done: row.done
        };
      }
    });

    const mergedStats = Object.values(statsMap).sort((a, b) => b.month.localeCompare(a.month));

    return mergedStats;
  } finally {
    await conn.end();
  }
};

// 누적 거래 요청 수
exports.getTotalPurchaseRequests = async () => {
  const conn = await dbconn.init();
  await conn.connect();
  const [rows] = await conn.promise().query(`SELECT COUNT(*) AS total FROM purchase_request`);
  await conn.end();
  return rows[0].total;
};

// 누적 거래 완료 수
exports.getTotalCompletedTrades = async () => {
  const conn = await dbconn.init();
  await conn.connect();
  const [rows] = await conn.promise().query(`SELECT COUNT(*) AS done FROM post WHERE status = '거래완료'`);
  await conn.end();
  return rows[0].done;
};

// 카테고리별 거래 통계
exports.getCategoryTradeStats = async () => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
    SELECT
      cm.name AS main_name,
      cs.name AS sub_name,
      COUNT(*) AS completed_count
    FROM post p
    JOIN category_sub cs ON p.category_id = cs.sub_id
    JOIN category_main cm ON cs.main_id = cm.main_id
    WHERE p.status = '거래완료'
    GROUP BY cm.name, cs.name
    ORDER BY completed_count DESC
  `;

  const [rows] = await conn.promise().query(sql);
  await conn.end();
  return rows;
};

//건의 사항
exports.getAllSuggestions = async () => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
    SELECT s.*, u.nick_name
    FROM suggestion s
    LEFT JOIN user u ON s.user_id = u.user_id
    ORDER BY s.created_at DESC
  `;
  const [rows] = await conn.promise().query(sql);
  await conn.end();
  return rows;
};

// 건의 사항 답변
exports.insertSuggestionReply = async (suggestion_id, reply) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
  UPDATE suggestion
  SET reply_content = ?, reply_at = NOW()
  WHERE suggestion_id = ?
`;
  await conn.promise().query(sql, [reply, suggestion_id]);
  await conn.end();
};

exports.getStats = async function () {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

const sql = `
  SELECT 
    (SELECT COUNT(*) FROM post) AS idea_count,
    (SELECT SUM(view_count) FROM post) AS total_views,
    (
        (SELECT COUNT(*) FROM comment) +
        (SELECT COUNT(*) FROM answer)
    ) AS feedback_count
  FROM DUAL;
`;

  const [rows] = await conn.promise().query(sql);
  await conn.end();
  return rows[0];
};
