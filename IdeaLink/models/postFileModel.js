const dbconn = require("../config/dbconn");
const path = require("path");

exports.insertFile = async function (file) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  var post_id = 1; // 테스트용 임시값 1고정
  const sql = `
    INSERT INTO post_file
    (post_id, original_name, saved_name, file_path, file_size, file_type)
    VALUES(?, ?, ?, ?, ?, ?);
  `;

  try {
    const [result] = await conn.promise().query(sql, [
      post_id, // 테스트용 임시값 1고정
      // file.post_id,
      file.encodingName, // 원본 파일명
      file.filename, // 저장된 파일명
      file.path,
      file.size,
      path.extname(file.originalname), // 확장자
    ]);
    return result; // result.insertId 사용 가능
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

  const sql = `SELECT * FROM post_file WHERE file_id = ?;`;

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

  var post_id = 1; // 테스트용 임시값 1고정
  const sql = `
    INSERT INTO watermark_file
    (original_file_id, watermarked_path)
    VALUES(?, ?);
  `;

  try {
    const [result] = await conn.promise().query(sql, [
      insertId,
      wm_path
    ]);
    return result; // result.insertId 사용 가능
  } catch (err) {
    console.error("첨부파일 insert 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};