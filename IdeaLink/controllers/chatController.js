const chatModel = require('../models/chatModel');
const postFileModel = require('../models/postFileModel');
const axios = require("axios");

exports.renderChatPage = async (req, res, next) => {
    try {
        const sender_id = req.user.user_id;
        const receiver_id = req.body.receiver_id;
        const post_id = req.body.post_id;
        const type = req.body.type;

        // 1. 채팅방 확인/생성
        const chatting_room_id = await chatModel.findOrCreateChattingRoom(
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

exports.uploadChatFiles = async (req, res) => {
    try {
        const { chatting_room_id, receiver_id, content } = req.body;
        const sender_id = req.user.user_id;
        const files = req.files;
        console.log('업로드된 파일:', files);

        // 1. 메시지 저장
        const messageId = await chatModel.saveMessage(sender_id, receiver_id, content, chatting_room_id);

        if (files && files.length > 0) {
            // 2. 파일 정보 저장 및 워터마크 처리
            const fileInsertions = await Promise.all(
                files.map(async (file) => {
                    // 2-1. post_file 테이블에 파일 정보 저장
                    const fileResult = await postFileModel.insertFile(file, messageId, "message");
                    const fileId = fileResult.insertId;

                    // 2-2. message_file 테이블에 연결 정보 저장 (추가)
                    await chatModel.insertMessageFile(messageId, fileId);

                    // 2-3. 플라스크 서버로 워터마크 요청
                    const options = {
                        method: "GET",
                        url: "http://localhost:5000/watermark",
                        data: { files },
                        headers: { "Content-Type": "application/json" },
                    };
                    const result = await axios(options);
                    const wm_path = result.data.wm_path;

                    // 2-4. 워터마크 정보 저장
                    const watermark_id = await postFileModel.insertWaterMarkFile(fileId, wm_path);

                    return {
                        watermark_id,
                        fileId,
                        originalName: file.originalname,
                        savedName: file.filename,
                        wm_path
                    };
                })
            );
            // 3. 알림 전송 (app에서 주입된 함수 사용)
            const sendNotification = req.app.get('sendNotification');
            await sendNotification(
                receiver_id,
                sender_id,
                "chat",
                chatting_room_id,
                content,
            );
            const data = {
                    message_id: messageId,
                    sender_id,
                    receiver_id,
                    content,
                    chatting_room_id,
                    created_at: new Date(),
                    files,
                    watermark_id: fileInsertions.map(item => item.watermark_id)
            };
            console.log('watermark_ids:', fileInsertions.map(item => item.watermark_id));
            // 4. 채팅방에 메시지 브로드캐스팅
            const io = req.app.io;
            io.of('/chat').to(`room_${chatting_room_id}`).emit('message', data);

            // 응답 데이터 구성
            res.json({
                success: true,
                message: '파일 업로드, 메시지 저장, 워터마크 처리 완료',
                messageId,
                files: fileInsertions
            });
        } else {
            // 파일이 없는 경우 응답
            res.json({
                success: true,
                message: '메시지 저장 완료',
                messageId
            });
        }
    } catch (err) {
        console.error('채팅 파일 업로드 오류:', err);
        res.status(500).json({ success: false, error: '파일 업로드 실패' });
    }
};
