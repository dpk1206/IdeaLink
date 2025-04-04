const dbconn = require("../config/dbconn");

exports.selectTest = async function () {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  const sql = "select * from test_table";
  try {
    const [result] = await conn.promise().query(sql);

    console.log(result);
    return result;
  } catch (err) {
    console.error(err);
  }

  // await conn.query(sql, (error, results) => {
  //   if (error) {
  //     console.error(error);
  //     return;
  //   }
  //   console.log(results);
  //   return results;
  // });
  await conn.end(); // 연결 종료
};
