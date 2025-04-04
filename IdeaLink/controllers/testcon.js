const testModel = require("../models/testmodel");

exports.selectTest = async function () {
    try {
      const result = await testModel.selectTest();
      return result;
    } catch (err) {
      console.error("Error in controller: ", err);
      throw err;
    }
  };