const dbconn = require("../config/dbconn");  // MySQL 연결 설정

// 카테고리 모델 정의
module.exports = {
  // main_category로 main_id 찾기
  getMainCategoryId: async (main_category) => {
    const sql = `
      SELECT main_id
      FROM category_main
      WHERE name = ?
      LIMIT 1
    `;
    const [rows] = await dbconn.promise().query(sql, [main_category]);
    return rows[0] ? rows[0].main_id : null;  // main_id가 없으면 null 반환
  },

  // sub_category와 main_id로 sub_id 찾기
  getSubCategoryId: async (main_id, sub_category) => {
    const sql = `
      SELECT sub_id
      FROM category_sub
      WHERE main_id = ? AND name = ?
      LIMIT 1
    `;
    const [rows] = await dbconn.promise().query(sql, [main_id, sub_category]);
    return rows[0] ? rows[0].sub_id : null;  // sub_id가 없으면 null 반환
  }
};
