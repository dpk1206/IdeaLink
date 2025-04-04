var mysql = require("mysql2");
require('dotenv').config();

var db_info = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "idealink",
};

module.exports = {
  init: function () {
    return mysql.createConnection(db_info);
  },
  connect: function (conn) {
    conn.connect(function (err) {
      if (err) console.error("mysql 연결 오류 : " + err);
      else console.log("mysql 연결 성공!");
    });
  },
};
