const chatModel = require('../models/chatModel');
// 소켓ID, 사용자 ID 저장 변수
const users = {}; // ex) { user_id: socket.id }

module.exports = (io) => {
    io.on('connection', (socket) => {
        const userId = socket.handshake.auth.user_id;
        // console.log('사용자 연결:', socket.id);
        // console.log('연결된 user_id:', userId);
        users[userId] = socket.id; // userId와 socket.id 매핑
        socket.userId = userId;    // 소켓 객체에도 저장(선택)
        console.log('소켓 정보들:', users);
        // 1:1 메시지 처리 예시
        socket.on('privateMessage', (data) => {
            const { sender_id, receiver_id, content } = data;
            console.log(`사용자 ${sender_id}가 사용자 ${receiver_id}에게 메시지를 보냅니다: ${content}`);
            // 메시지 DB 저장 로직 (모델에서 처리)
            chatModel.saveMessage(sender_id, receiver_id, content)
            // 상대방 소켓에 전송
            const receiverSocketId = users[receiver_id];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('privateMessage', { sender_id, content });
            } else {
                // TODO:상대방이 오프라인일 때 처리
            }
        });

        // 다른 소켓 이벤트도 추가 가능
    });
};