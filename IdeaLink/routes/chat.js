const express = require("express");
const router = express.Router();
const requireLogin = require("../middleware/requireLogin");
const chatController = require('../controllers/chatController');

// 테스트 1:1 채팅페이지
router.get('/', requireLogin, chatController.renderChatPage);











module.exports = router;