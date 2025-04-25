const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

// 게시글 등록 폼을 GET 방식으로 처리
router.get('/submit_idea', function(req, res, next) {
  res.render('submit_idea');  // 게시글 등록 페이지
});

// 게시글 등록을 POST 방식으로 처리 (파일 업로드 포함)
router.post('/submit_idea', postController.uploadFiles, postController.createPost);

module.exports = router;
