var express = require('express');
var router = express.Router();
const postRouter = require('./post');  // postRouter.js 파일 불러오기

// 메인페이지
router.get('/', function(req, res, next) {
  res.render('main', { name: '홍길동' });
});

// 로그인 회원가입 페이지 이동
router.get('/login_signup', function(req, res, next) {
  res.render('login_signup');
});

// 회원가입 정보제공
router.get('/privacy', function(req, res, next) {
  res.render('privacy');
});

// 회원가입 이용약관
router.get('/terms', function(req, res, next) {
  res.render('terms');
});

// FAQ, 건의
router.get('/faq', function(req, res, next) {
  res.render('suggest_faq');
});

// 공지
router.get('/notice', function(req, res, next) {
  res.render('notice');
});

// 어드민 - 일단 그냥 연결 추후 접근제한 필요(users로 따로 뺄까?)
router.get('/admin', function(req, res, next) {
  res.render('admin');
});

module.exports = router;
