const chatModel = require('../models/chatModel');

exports.renderChatPage = async (req, res) => {
    const userId = req.user.user_id;
    const partnerId = req.query.partner_id;
    // console.log("현재유저", userId, "채팅상대", partnerId);
    const messages = await chatModel.getMessages(userId, partnerId);
    // console.log("채팅 메시지:", messages);
    res.render('chat', { messages, partnerId });
};