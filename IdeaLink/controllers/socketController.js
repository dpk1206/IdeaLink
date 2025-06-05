const chatModel = require('../models/chatModel');

// 알림용 네임스페이스와 채팅용 네임스페이스 분리
const notificationUsers = {};  // 알림용 유저 매핑
const chatUsers = {};          // 채팅용 유저 매핑

module.exports = (io) => {
    // 1. 알림용 네임스페이스 (/notification)
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

    // 2. 채팅용 네임스페이스 (/chat)
    const chatNamespace = io.of('/chat');
    chatNamespace.on('connection', (socket) => {
        const userId = socket.handshake.auth.user_id;
        chatUsers[userId] = socket.id;
        console.log('채팅 소켓 연결:', userId);

        // 채팅방 입장 핸들러
        socket.on('joinRoom', (chatting_room_id) => {
            const roomName = `room_${chatting_room_id}`;
            socket.join(roomName);
            console.log(`[채팅] 사용자 ${userId}가 방 ${chatting_room_id}에 입장`);
        });

        // 메시지 처리 핸들러
        socket.on('message', async (data) => {
            const { sender_id, receiver_id, content, chatting_room_id } = data;
            console.log(`[채팅] 사용자 ${sender_id}가 방 ${chatting_room_id}에서 사용자 ${receiver_id}에게 메시지: ${content}`);


            const insertId = await chatModel.saveMessage(sender_id, receiver_id, content, chatting_room_id);

            // 해당 채팅방(room)에만 메시지 전송
            chatNamespace.to(`room_${chatting_room_id}`).emit('message', {
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
            console.log("채팅소켓 ", chatUsers)
            try {
                // 1. DB 읽음 업데이트
                const success = await chatModel.markMessageAsRead(message_id, userId);
                // 2. 읽은 본인에게 실시간 읽음 처리
                chatNamespace.to(chatUsers[userId]).emit('messageRead', { message_id: message_id });

                // 3. 발신자가 해당 채팅방에 있는지 확인
                const messageInfo = await chatModel.getMessageById(message_id);
                // console.log("메시지",messageInfo);
                const senderSocketId = chatUsers[messageInfo.sender_id];
                // console.log("소켓id", senderSocketId);
                if (!senderSocketId) {
                    console.log('발신자가 오프라인입니다.');
                    return;
                }
                if (senderSocketId) {
                    const senderSocket = chatNamespace.sockets.get(senderSocketId);

                    // 발신자가 방에 입장해 있으면 이벤트 전송
                    if (senderSocket?.rooms.has(`room_${messageInfo.chatting_room_id}`)) {
                        chatNamespace.to(senderSocketId).emit('messageRead', { message_id: message_id });
                    }
                }
            } catch (err) {
                console.error('읽음 처리 실패:', err);
            }
        });

        socket.on('disconnect', () => {
            delete chatUsers[userId];
        });
    });
};
