const testModel = require("../models/testmodel");

// DB 테스트용
exports.selectTest = async function (req, res) {
  try {
    const result = await testModel.selectTest();
    res.render("aaa", { title: result });
  } catch (err) {
    console.error("Error in controller: ", err);
    throw err;
  }
};