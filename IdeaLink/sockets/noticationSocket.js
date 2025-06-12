const chatModel = require('../models/chatModel');
const notificationModel = require('../models/notificationModel');

// 알림용 네임스페이스와 채팅용 네임스페이스 분리
const { notificationUsers, chatUsers } = require('./userSocketMapping');  // 소켓 유저 매핑

module.exports = (io) => {
    // 알림용 네임스페이스 (/notification)
    const notificationNamespace = io.of('/notification');
    notificationNamespace.on('connection', (socket) => {
        const userId = socket.handshake.auth.user_id;
        notificationUsers[userId] = socket.id;
        console.log('알림 소켓 연결:', userId);

        // 알림 이벤트 핸들러
        socket.on('notification', (data) => {
            console.log('새 알림:', data);
            // 알림 관련 로직 처리
        });

        socket.on('disconnect', () => {
            delete notificationUsers[userId];
        });
    });
};
