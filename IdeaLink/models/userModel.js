// models/userModel.js
const dbconn = require("../config/dbconn");

// 사용자 정보 저장 (회원가입)
exports.insertUser = async function (userType, name, email, password) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  const sql = "INSERT INTO users (user_type, name, email, password) VALUES (?, ?, ?, ?)";

  try {
    const [result] = await conn.promise().query(sql, [userType, name, email, password]);
    return result; // result.insertId 사용됨
  } catch (err) {
    console.error("회원가입 쿼리 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};

// 이메일 중복 확인 함수
exports.checkEmailDuplicate = async function (email) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  const sql = "SELECT COUNT(*) AS count FROM users WHERE email = ?";

  try {
    const [rows] = await conn.promise().query(sql, [email]);
    return rows[0].count > 0; // 중복되면 true 반환
  } catch (err) {
    console.error("이메일 중복 확인 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};

// 이메일로 사용자 찾기 (로그인용)
exports.findUserByEmail = async function (email) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  const sql = "SELECT * FROM users WHERE email = ?";

  try {
    const [rows] = await conn.promise().query(sql, [email]);
    return rows[0]; // 첫 번째 사용자 정보 반환
  } catch (err) {
    console.error("로그인 쿼리 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};
