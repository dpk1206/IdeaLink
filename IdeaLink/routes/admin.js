const express = require("express");
const router = express.Router();
const adminMiddleware = require("../middleware/adminMiddleware");
const adminController = require('../controllers/adminController');
const postController = require("../controllers/postController");
router.use(adminMiddleware);

// ✅ 관리자 대시보드 → 게시글+답글 데이터 포함해서 렌더링
router.get("/dashboard", adminController.renderAdminPage);

// 포인트 로그 API
router.get('/point-logs', adminController.getAllPointLogs);


router.get('/point-total', adminController.getAdminTotalPoint);


// 게시글+답글 JSON API (필요 시)
router.get('/posts', adminController.getAllPostsWithAnswers);

router.post('/select_answer', adminController.selectAnswerByAdmin);

//공지사항
router.get('/notices', adminController.getNotices);        // 목록 조회
router.post('/notices', adminController.addNotice);        // 등록
router.put('/notices/:id', adminController.editNotice);    // 수정
router.delete('/notices/:id', adminController.deleteNotice); // 삭제

// 상태
router.post('/update_status', adminMiddleware, adminController.updateContentStatus);

// 관리자 통계 조회
router.get('/stats', adminMiddleware, adminController.getAdminStats);
// 카테고리별 통계 조회
router.get('/category_stats', adminMiddleware, adminController.getCategoryStats);

router.post('/reply_suggestion/:suggestion_id', adminController.replySuggestion);

module.exports = router;
