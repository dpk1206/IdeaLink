const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const ejs = require('ejs'); // ejs 뷰엔진진
const cors = require('cors'); // 외부 url요청청
const fs = require('fs') // 파일시스템
const multer = require("multer"); // 이미지 관련
const authMiddleware = require('./middleware/authMiddleware');

// DB 연결
const db_config = require('./config/dbconn');
const conn = db_config.init();
db_config.connect(conn);



var indexRouter = require('./routes/index'); // 라우터 파일 설정1
var usersRouter = require('./routes/users'); // 라우터 파일 설정2
var postRouter = require('./routes/post'); // 게시글 라우터  파일

var app = express();

app.use(cookieParser());
app.use(authMiddleware); // 쿠키에 담긴 토큰 매 요청마다 검증
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors())
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // 파일업로드 폴더 설정
app.use('/wm_uploads', express.static(path.join(__dirname, '../wm_uploads'))); // 파일업로드 폴더 설정

//라우터 연결
app.use('/', indexRouter); // 그냥 요청은 index.js 라우터파일 처리
app.use('/users', usersRouter); // /users/~~ 요청은 users.js 라우터파일 처리
app.use('/post', postRouter);  

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
// 오류 발생시 error.ejs 페이지 보여줌
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
