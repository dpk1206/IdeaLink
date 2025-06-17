const dbconn = require('../config/dbconn');

// 관리자용 전체 게시글 + 답글 조회
exports.getAllPostsWithAnswers = async (req, res) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  try {
    // 게시글 + 작성자 닉네임
    const [posts] = await conn.promise().query(`
      SELECT p.*, u.nick_name
      FROM post p
      LEFT JOIN user u ON p.user_id = u.user_id
      ORDER BY p.created_at DESC
    `);

    // 각 게시글마다 답글 붙이기
    for (let post of posts) {
      const [answers] = await conn.promise().query(`
        SELECT a.*, u.nick_name 
        FROM answer a 
        LEFT JOIN user u ON a.user_id = u.user_id
        WHERE a.post_id = ?
        ORDER BY a.created_at ASC
      `, [post.post_id]);

      post.answers = answers;
    }

    res.render('admin_posts', { posts });
  } catch (err) {
    console.error('게시글/답글 조회 실패:', err);
    res.status(500).send('서버 오류');
  } finally {
    await conn.end();
  }
};

exports.getAllPointLogs = async (req, res) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  try {
    const sql = `
      SELECT 
        pl.created_at,
        u.nick_name,
        pl.type,
        pl.amount,
        pl.description
      FROM point_log pl
      LEFT JOIN user u ON pl.user_id = u.user_id
      ORDER BY pl.created_at DESC
    `;
    const [rows] = await conn.promise().query(sql);
    res.json({ success: true, logs: rows });
  } catch (err) {
    console.error('포인트 로그 조회 실패:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  } finally {
    await conn.end();
  }
};
