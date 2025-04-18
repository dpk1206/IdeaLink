const dbconn = require("../config/dbconn");

exports.insertUser = async function (user) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  
  // 카카오 로그인 시, password를 null로 설정
  const password = user.password || null;  // 카카오 로그인인 경우 password는 null로 설정

  const sql = `
    INSERT INTO user
    (user_type, email, password, name, nick_name, phone, join_type, sns_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    const [result] = await conn.promise().query(sql, [
      user.user_type,
      user.email,
      password,  // 카카오 로그인 시 비밀번호를 null로 설정
      user.name,
      user.nick_name,
      user.phone,
      user.join_type,
      user.sns_id
    ]);
    return result; // result.insertId 사용 가능
  } catch (err) {
    console.error("회원가입 쿼리 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};


// ✅ 이메일 중복 확인
exports.checkEmailDuplicate = async function (email) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  const sql = "SELECT COUNT(*) AS count FROM user WHERE email = ?";

  try {
    const [rows] = await conn.promise().query(sql, [email]);
    return rows[0].count > 0; // 중복되면 true
  } catch (err) {
    console.error("이메일 중복 확인 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};

//  ✅ 닉네임 중복 확인 (닉네임도 중복 넣을꺼면 이거 쓰면됨됨)
// exports.checkNickNameDuplicate = async function (nickName) {
//   const conn = await dbconn.init();
//   await dbconn.connect(conn);
//   const sql = "SELECT COUNT(*) AS count FROM users WHERE nick_name = ?";

//   try {
//     const [rows] = await conn.promise().query(sql, [nickName]);
//     return rows[0].count > 0; // 중복되면 true
//   } catch (err) {
//     console.error("닉네임 중복 확인 오류:", err);
//     throw err;
//   } finally {
//     await conn.end();
//   }
// };

// ✅ 이메일로 사용자 정보 조회 (로그인 시 사용)
exports.findUserByEmail = async function (email) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  const sql = "SELECT * FROM user WHERE email = ?";

  try {
    const [rows] = await conn.promise().query(sql, [email]);
    return rows[0]; // 사용자 1명 반환
  } catch (err) {
    console.error("로그인 사용자 조회 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};
// sns_id로 사용자 조회 함수 추가
exports.findUserBySnsId = async function (snsId, joinType) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  console.log("sns 아이디 :",snsId );
  const sql = "SELECT * FROM user WHERE sns_id = ? AND join_type = ?";
  
  try {
    const [rows] = await conn.promise().query(sql, [snsId, joinType]);
    
    return rows[0];  // 첫 번째 결과만 반환
  } catch (err) {
    console.error("SNS ID로 사용자 조회 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};