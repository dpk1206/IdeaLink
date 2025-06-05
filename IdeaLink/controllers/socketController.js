const chatModel = require('../models/chatModel');
// 소켓ID, 사용자 ID 저장 변수
const users = {}; // ex) { user_id: socket.id }

module.exports = (io) => {
    io.on('connection', (socket) => {
        const userId = socket.handshake.auth.user_id;
        users[userId] = socket.id; // userId와 socket.id 매핑
        socket.userId = userId;    // 소켓 객체에도 저장(선택)
        console.log('소켓 정보들:', users);

        // 채팅방 입장
        socket.on('joinRoom', (chatting_room_id) => {
            const roomName = `room_${chatting_room_id}`;
            socket.join(roomName);
            console.log(`사용자 ${userId}가 방 ${chatting_room_id}에 입장`);
        });

        // 1:1 메시지 처리 (채팅방 기반)
        socket.on('message', async (data) => {
            const { sender_id, receiver_id, content, chatting_room_id } = data;
            console.log(`사용자 ${sender_id}가 방 ${chatting_room_id}에서 사용자 ${receiver_id}에게 메시지: ${content}`);

            // 메시지 DB 저장
            const insertId = await chatModel.saveMessage(sender_id, receiver_id, content, chatting_room_id);

            // 해당 채팅방(room)에만 메시지 전송
            io.to(`room_${chatting_room_id}`).emit('message', {
                message_id: insertId,
                sender_id,
                receiver_id,
                content,
                chatting_room_id,
                created_at: new Date()
            });
        });

        // 메시지 읽음 처리
        socket.on('markAsRead', async (message_id) => {
            try {
                // 1. DB 읽음 업데이트
                const success = await chatModel.markMessageAsRead(message_id, userId);
                // 2. 읽은 본인에게 실시간 읽음 처리
                io.to(users[userId]).emit('messageRead', { message_id: message_id });

                // 3. 발신자가 해당 채팅방에 있는지 확인
                const messageInfo = await chatModel.getMessageById(message_id);
                // console.log("메시지",messageInfo);
                const senderSocketId = users[messageInfo.sender_id];
                // console.log("소켓id", senderSocketId);
                if (!senderSocketId) {
                    console.log('발신자가 오프라인입니다.');
                    return;
                }
                if (senderSocketId) {
                    const senderSocket = io.sockets.sockets.get(senderSocketId);

                    // 발신자가 방에 입장해 있으면 이벤트 전송
                    if (senderSocket?.rooms.has(`room_${messageInfo.chatting_room_id}`)) {
                        io.to(senderSocketId).emit('messageRead', { message_id: message_id });
                    }
                    if (!senderSocket?.rooms.has(`room_${messageInfo.chatting_room_id}`)) {
                        console.log('발신자가 채팅방에 없습니다.');
                        return;
                    }
                }
            } catch (err) {
                console.error('읽음 처리 실패:', err);
            }
        });

        // 연결 해제 시 users에서 제거
        socket.on('disconnect', () => {
            if (socket.userId) {
                delete users[socket.userId];
            }
        });
    });
};
