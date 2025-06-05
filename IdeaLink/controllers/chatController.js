const chatModel = require('../models/chatModel');

exports.renderChatPage = async (req, res, next) => {
    try {
        const sender_id = req.user.user_id;
        const receiver_id = req.query.receiver_id;
        const post_id = req.query.post_id;
        const type = req.query.type;

        // 1. 채팅방 확인/생성
        const chatting_room_id = await chatModel.findOrCreateConversation(
            sender_id,
            receiver_id,
            post_id,
            type
        );

        // 2. 게시물 제목 조회
        const title = await chatModel.getTitle(post_id, type);

        // 3. 기존 메시지 조회
        const messages = await chatModel.getMessages(chatting_room_id);

        res.render('chat', {
            title: title,
            chatting_room_id: chatting_room_id,
            messages,
            sender_id,
            receiver_id
        });

    } catch (err) {
        next(err);
    }
};