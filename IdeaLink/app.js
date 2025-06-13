const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const ejs = require('ejs'); // ejs 뷰엔진
const cors = require('cors'); // 외부 url요청
const socketIO = require('socket.io'); // socketIO
const authMiddleware = require('./middleware/authMiddleware');
const chatSocketController = require('./sockets/chatSocket');
const notiSocketController = require('./sockets/noticationSocket');
const adminRouter = require('./routes/admin');

// DB 연결(모든 요청에 DB연결? 필요시 주석 해제 하삼)
// const db_config = require('./config/dbconn');
// const conn = db_config.init();
// db_config.connect(conn);

// 라우터 파일 설정
var indexRouter = require('./routes/index'); // 기본 연결 라우터
var usersRouter = require('./routes/users'); // 유저 라우터
var postRouter = require('./routes/post'); // 게시글 라우터
var chatRouter = require('./routes/chat'); // 채팅 라우터
const paymentRouter = require("./routes/payment"); // 결제 라우터

// 서버 설정
var app = express();
app.io = socketIO(); // Socket.IO 서버 인스턴스 생성
chatSocketController(app.io); // 채팅 소켓
notiSocketController(app.io); // 알림 소켓

app.use(cookieParser());
app.use(authMiddleware); // 쿠키에 담긴 토큰 매 요청마다 검증

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors())
app.use(express.static(path.join(__dirname, 'public'))); // 정적 파일 경로 설정
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // 파일업로드 폴더 설정
app.use('/wm_uploads', express.static(path.join(__dirname, '../wm_uploads'))); // 파일업로드 폴더 설정

//라우터 연결
app.use('/', indexRouter); // 그냥 요청은 index.js 라우터파일 처리
app.use('/users', usersRouter); // /users/~~ 요청은 users.js 라우터파일 처리
app.use('/post', postRouter); 
app.use("/payment", paymentRouter); // 결제 관련 라우터 연결
app.use("/chat", chatRouter); // 결제 관련 라우터 연결

// 관리자 페이지 라우터 연결
app.use('/admin', adminRouter);

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
