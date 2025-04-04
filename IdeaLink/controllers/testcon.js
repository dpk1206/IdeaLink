const testModel = require("../models/testmodel");

// exports.selectTest = async function () {
//   try {
//     const result = await testModel.selectTest();
//     return result;
//   } catch (err) {
//     console.error("Error in controller: ", err);
//     throw err;
//   }
// };
exports.selectTest = async function (req, res) {
  try {
    const result = await testModel.selectTest();
    res.render("aaa", { title: result });
  } catch (err) {
    console.error("Error in controller: ", err);
    throw err;
  }
};
