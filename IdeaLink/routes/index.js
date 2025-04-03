var express = require('express');
var router = express.Router();

// 메인페이지
router.get('/', function(req, res, next) {
  res.render('main', { name: '홍길동' });
});

// 로그인 회원가입 페이지 이동
router.get('/sign_in_up', function(req, res, next) {
  res.render('sign_in_up');
});

// FAQ, 건의
router.get('/faq', function(req, res, next) {
  res.render('suggest_faq');
});

// 게시물상세
router.get('/idea_detail', function(req, res, next) {
  res.render('idea_detail');
});

// 공지
router.get('/notice', function(req, res, next) {
  res.render('notice');
});

// 공지
router.get('/submit_idea', function(req, res, next) {
  res.render('submit_idea');
});

// 카테고리???
router.get('/ideas', function(req, res, next) {
  res.render('ideas');
});

// 마이페이지 - 일단 그냥 연결 추후 접근제한 필요(users로 따로 뺄까?)
router.get('/mypage', function(req, res, next) {
  res.render('mypage');
});

// 어드민 - 일단 그냥 연결 추후 접근제한 필요(users로 따로 뺄까?)
router.get('/admin', function(req, res, next) {
  res.render('admin');
});

module.exports = router;
