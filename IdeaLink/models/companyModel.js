// models/companyModel.js
const dbconn = require("../config/dbconn");

// 기업회원 정보 저장
exports.insertCompanyInfo = async function (
  company_name,
  business_id,
  company_phone,
  company_address,
  company_website,
  company_email,
  company_password,
  user_id
) {
  const conn = await dbconn.init();
  await dbconn.connect(conn);
  const sql = `
    INSERT INTO companies 
    (company_name, business_id, company_phone, company_address, company_website, company_email, company_password, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    const [result] = await conn.promise().query(sql, [
      company_name,
      business_id,
      company_phone,
      company_address,
      company_website,
      company_email,
      company_password,
      user_id
    ]);
    return result; // 기업 정보 저장 성공 시 결과 반환
  } catch (err) {
    console.error("기업회원 등록 쿼리 오류:", err);
    throw err;
  } finally {
    await conn.end();
  }
};