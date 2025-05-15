const dbconn = require("../config/dbconn");
const path = require("path");

exports.insertFile = async function (file, post_id, post_type) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  // post_id 유효성 검사: 숫자이거나, 잘못된 값이 아닐 때 처리
  if (!post_id || isNaN(post_id)) {
    throw new Error("유효한 post_id가 아닙니다.");
  }

  // 파일의 저장 경로를 정확하게 설정
  const filePath = path.join(__dirname, "../../uploads", file.filename);

  const sql = `
    INSERT INTO post_file
    (post_id, original_name, saved_name, file_path, file_size, file_type, post_type)
    VALUES(?, ?, ?, ?, ?, ?, ?);
  `;

  try {
    const [result] = await conn.promise().query(sql, [
      post_id, // 게시글 ID (동적으로 전달)
      file.encodingName, // 원본 파일명
      file.filename, // 저장된 파일명
      file.path, // 저장된 경로
      file.size, // 파일 크기
      path.extname(file.originalname).toLowerCase(), // 파일 확장자 (소문자로 처리)
      post_type // 게시물 타입(post, answer)
    ]);
    return result; // 결과 반환
  } catch (err) {
    console.error("첨부파일 insert 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};

// 파일id로 조회
exports.selectOneFile = async function (file_id) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
    SELECT 
      pf.original_name,
      wf.watermarked_path
    FROM 
      watermark_file wf
    INNER JOIN 
      post_file pf ON wf.original_file_id = pf.file_id
    WHERE 
      wf.watermark_id = ?`;

  try {
    const [rows] = await conn.promise().query(sql, [file_id]);
    return rows[0] || null; // 파일이 없으면 null 반환
  } catch (err) {
    console.error("첨부파일 다운로드 select 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};

// 워터마크 파일 insert
exports.insertWaterMarkFile = async function (insertId, wm_path) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
    INSERT INTO watermark_file
    (original_file_id, watermarked_path)
    VALUES(?, ?);
  `;

  try {
    const [result] = await conn.promise().query(sql, [insertId, wm_path]);
    return result; // result.insertId 사용 가능
  } catch (err) {
    console.error("첨부파일 insert 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};

// 게시물 상세 조회
exports.selectDetailFile = async function (post_id, post_type) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
    SELECT 
      pf.original_name,
      pf.saved_name,
      wf.watermark_id,
      wf.watermarked_path
    FROM 
      post_file pf
    INNER JOIN 
      watermark_file wf ON pf.file_id = wf.original_file_id
    WHERE 
      pf.post_id = ?
    AND
      pf.post_type = ?`;

  try {
    const [rows] = await conn.promise().query(sql, [post_id, post_type]);
    return rows || null; // 파일이 없으면 null 반환
  } catch (err) {
    console.error("첨부파일 다운로드 select 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};
