const express = require("express");
const router = express.Router();
const requireLogin = require("../middleware/requireLogin");
const chatController = require('../controllers/chatController');

// 1:1 채팅페이지
router.post('/', requireLogin, chatController.renderChatPage);











module.exports = router;