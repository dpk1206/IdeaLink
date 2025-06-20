const notificationModel = require('../models/notificationModel');
const { notificationUsers } = require('./userSocketMapping');

let notificationNamespace; // 네임스페이스 저장용 변수

// 알림 생성 및 소켓 전송
async function sendNotification(receiver_id, sender_id, type, target_id, content) {
    let notificationContent = '';
    if (type === 'comment') {
        notificationContent = `새 댓글이 달렸습니다 : ${content.substring(0, 20)}${content.length > 20 ? '...' : ''}`;
    } else if (type === 'like') {
        notificationContent = `추천수가 늘었습니다 : ${content.substring(0, 20)}${content.length > 20 ? '...' : ''}`;
    } else if (type === 'answer') {
        notificationContent = `새 답글이 달렸습니다 : ${content.substring(0, 20)}${content.length > 20 ? '...' : ''}`;
    } else if (type === 'chat') {
        notificationContent = `새 메시지가 도착했습니다 : ${content.substring(0, 20)}${content.length > 20 ? '...' : ''}`;
    }

    await notificationModel.createNotification(
        receiver_id,
        sender_id,
        type,
        target_id,
        notificationContent
    );

    // 알림 수신자가 연결된 경우에만 전송
    if (notificationUsers[receiver_id] && notificationNamespace) {
        const unreadCount = await notificationModel.getUnreadNotificationCount(receiver_id);
        notificationNamespace.to(notificationUsers[receiver_id]).emit('notification', {
            type,
            content: notificationContent,
            target_id,
            unreadCount
        });
    }
}

module.exports = (io) => {
    notificationNamespace = io.of('/notification'); // 네임스페이스 저장
    notificationNamespace.on('connection', (socket) => {
        const userId = socket.handshake.auth.user_id;
        notificationUsers[userId] = socket.id;
        console.log('알림 소켓 연결:', userId);

        socket.on('disconnect', () => {
            delete notificationUsers[userId];
        });
    });

    return { sendNotification }; // 함수 외부 모듈화
};
