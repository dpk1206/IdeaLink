const bcrypt = require('bcryptjs');
const dbconn = require("../config/dbconn");

exports.insertUser = async function (user) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  
  // 카카오 로그인 시, password를 null로 설정
  let password = user.password || null;  // 카카오 로그인인 경우 password는 null로 설정

  // 일반 회원가입인 경우 비밀번호 암호화
  if (password && user.join_type !== 'kakao' && user.join_type !== 'naver') {
    const saltRounds = 10; // bcrypt saltRounds 설정 (비밀번호 암호화 강도)
    password = await bcrypt.hash(password, saltRounds);
  }

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

// user_id로 사용자 정보 조회 (로그인 시 사용)
exports.selectUserByUserID = async function (user_id) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  // password는 제외하고 가져와야 하지만
  const sql = "SELECT * FROM user WHERE user_id = ?";

  try {
    const [rows] = await conn.promise().query(sql, [user_id]);
    // 귀찮으니 가져와서 제거
    delete rows[0].password;
    return rows[0]; // 사용자 1명 반환
  } catch (err) {
    console.error("로그인 사용자 조회 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};

// 포인트 로그 삽입 함수
exports.insertPointLog = async function (user_id, type, amount, description) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `
    INSERT INTO point_log (user_id, type, amount, description)
    VALUES (?, ?, ?, ?)
  `;

  try {
    await conn.promise().query(sql, [user_id, type, amount, description]);
  } catch (err) {
    console.error("포인트 로그 삽입 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};

//  포인트 적립 함수
exports.addPointToUser = async function (user_id, amount) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  const sql = "UPDATE user SET point = point + ? WHERE user_id = ?";

  try {
    console.log("DB 적립 쿼리 실행:", { user_id, amount });  // 🔥 확인용
    await conn.promise().query(sql, [amount, user_id]);
  } catch (err) {
    console.error("포인트 적립 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};

// 포인트 로그 조회 함수
exports.getPointLogsByUserId = async function (user_id) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  const sql = `SELECT * FROM point_log WHERE user_id = ? ORDER BY created_at DESC`;

  try {
    const [rows] = await conn.promise().query(sql, [user_id]);
    return rows;
  } catch (err) {
    console.error("포인트 로그 조회 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};

// 포인트 차감 함수
exports.deductPointFromUser = async function (user_id, amount) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  const sql = "UPDATE user SET point = point - ? WHERE user_id = ?";

  try {
    await conn.promise().query(sql, [amount, user_id]);
  } catch (err) {
    console.error("포인트 차감 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};

// 사용자 포인트 조회 함수
exports.getUserPoint = async function (user_id) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);

  const sql = `SELECT point FROM user WHERE user_id = ?`;

  try {
    const [rows] = await conn.promise().query(sql, [user_id]);
    return rows[0]; // { point: ... } 형태로 반환
  } catch (err) {
    console.error("포인트 조회 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};

exports.hasUserPurchased = async (user_id, post_id) => {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  try {
    const [rows] = await conn.promise().query(
      `SELECT * FROM point_log 
       WHERE user_id = ? 
         AND type = 'use' 
         AND description LIKE ?`,
      [user_id, `%post_id: ${post_id}%`]
    );
    return rows.length > 0;
  } catch (err) {
    console.error("구매자 확인 오류:", err);
    return false;
  } finally {
    await conn.end();
  }
};
