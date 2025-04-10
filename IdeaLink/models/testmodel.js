const dbconn = require("../config/dbconn");

// 테스트 테이블 조회용 함수
exports.selectTest = async function () {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  const sql = "SELECT * FROM test_table";

  try {
    const [result] = await conn.promise().query(sql);
    console.log(result); // 콘솔에 결과 출력
    return result; // 결과 반환
  } catch (err) {
    console.error("테스트 쿼리 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};
