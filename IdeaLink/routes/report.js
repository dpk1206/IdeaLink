const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware'); // 👈 따로 분리해서 import

const reportController = require('../controllers/reportController');

// 유저 신고 관련
router.post('/', authMiddleware, reportController.submitReport);
router.get('/my', authMiddleware, reportController.getMyReports);

// 관리자 신고 관리
router.get('/admin', adminMiddleware, reportController.getAllReports);
router.post('/admin/reply/:report_id', adminMiddleware, reportController.replyReport);

module.exports = router;
