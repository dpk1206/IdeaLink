const dbconn = require("../config/dbconn");
const userModel = require('../models/userModel');

// 채팅 저장 및 채팅방 시간 업데이트
exports.saveMessage = async (senderId, receiverId, content, chatting_room_id) => {
    let conn;
    try {
        conn = await dbconn.init();
        await dbconn.connect(conn);
        const sql = `INSERT INTO message
        (sender_id, receiver_id, content, chatting_room_id)
        VALUES (?, ?, ?, ?)`;
        const result = await conn.promise().query(sql, [senderId, receiverId, content, chatting_room_id])

        // 채팅방의 updated_at 필드도 현재 시간으로 업데이트
        await conn.promise().query(
            'UPDATE chatting_room SET updated_at = now() where chatting_room_id = ?',
            [chatting_room_id]
        );
        return result[0].insertId; // 새로 생성된 메시지 ID 반환
    } catch (err) {
        console.error('saveMessage error:', err);
        throw err;
    } finally {
        if (conn) conn.end();
    }
};

// 해당 채팅방 메시지 조회
exports.getMessages = async (chatting_room_id) => {
    let conn;
    try {
        conn = await dbconn.init();
        await dbconn.connect(conn);
        const sql = `
        SELECT m.*, pf.*, wf.watermarked_path, wf.watermark_id
        FROM message m
        LEFT JOIN message_file mf ON m.message_id = mf.message_id
        LEFT JOIN post_file pf ON mf.file_id = pf.file_id
        LEFT JOIN watermark_file wf ON pf.file_id = wf.original_file_id
        WHERE m.chatting_room_id = ?
        ORDER BY m.created_at;
        `;
        const [rows] = await conn.promise().query(sql, [chatting_room_id]);
        return rows;
    } catch (err) {
        console.error('getMessages error:', err);
        throw err;
    } finally {
        if (conn) conn.end();
    }
};

// 채팅방 존재 여부 확인 및 생성
exports.findOrCreateChattingRoom = async (sender_id, receiver_id, post_id, type) => {
    let conn;
    try {
        conn = await dbconn.init();
        await dbconn.connect(conn);

        // 1. 기존 채팅방 조회
        const [existing] = await conn.promise().query(`
        SELECT chatting_room_id 
        FROM chatting_room 
        WHERE post_id = ? 
          AND (
            (user_id1 = ? AND user_id2 = ?) 
            OR 
            (user_id1 = ? AND user_id2 = ?)
          )
          AND type = ?
        `, [post_id, sender_id, receiver_id, receiver_id, sender_id, type]);

        if (existing.length > 0) {
            return existing[0].chatting_room_id;
        }

        // 2. 새로운 채팅방 생성
        const [newChat] = await conn.promise().query(
            'INSERT INTO chatting_room (user_id1, user_id2, post_id, type) VALUES (?, ?, ?, ?)',
            [sender_id, receiver_id, post_id, type]
        );

        return newChat.insertId;
    } catch (err) {
        console.error('findOrCreateConversation error:', err);
        throw err;
    } finally {
        if (conn) conn.end();
    }
};

// 채팅방 방제가 될 게시물 OR 답글 제목 조회
exports.getTitle = async (post_id, type) => {
    let conn;
    try {
        conn = await dbconn.init();
        await dbconn.connect(conn);

        // 허용된 테이블 이름 검증 (SQL 인젝션 방지)
        const allowedTypes = ['post', 'answer'];
        if (!allowedTypes.includes(type)) {
            throw new Error('Invalid type');
        }
        const typeId = type + "_id";

        // 쿼리 문자열 직접 구성 (테이블/컬럼 이름은 검증 후)
        const query = `SELECT title FROM ${type} WHERE ${typeId} = ?`;

        // 값만 파라미터 바인딩
        const [rows] = await conn.promise().query(query, [post_id]);

        return rows[0]?.title || '알 수 없음';
    } catch (err) {
        console.error('getTitle error:', err);
        throw err;
    } finally {
        if (conn) conn.end();
    }
};

// 메시지 읽음 처리
exports.markMessageAsRead = async (message_id, receiver_id) => {
    let conn;
    try {
        conn = await dbconn.init();
        await dbconn.connect(conn);

        const [result] = await conn.promise().query(`
          UPDATE message
          SET is_read = 1 
          WHERE message_id = ? 
            AND receiver_id = ?
        `, [message_id, receiver_id]);
        return result.affectedRows > 0;
    } catch (err) {
        console.error('markMessageAsRead error:', err);
        throw err;
    } finally {
        if (conn) conn.end();
    }
};

// 채팅 조회
exports.getMessageById = async (message_id) => {
    let conn;
    try {
        conn = await dbconn.init();
        await dbconn.connect(conn);
        const sql = `
        SELECT * 
        FROM message 
        WHERE message_id = ?
        `;
        const [rows] = await conn.promise().query(sql, [message_id]);
        return rows[0];
    } catch (err) {
        console.error('getMessageByMessageId error:', err);
        throw err;
    } finally {
        if (conn) conn.end();
    }
};

// 마이페이지 채팅방 목록
exports.getChattingRooms = async (user_id) => {
    let conn;
    try {
        conn = await dbconn.init();
        await dbconn.connect(conn);

        // 1. 기존 채팅방 조회
        const [rows] = await conn.promise().query(`
            SELECT * 
            FROM chatting_room 
            WHERE user_id1 = ? OR user_id2 = ?
            ORDER BY updated_at DESC;
        `, [user_id, user_id]);

        // 2. 각 채팅방에 제목(title), 상대 닉네임(partner_nickname), 안읽은 메시지 개수(unreadCount) 추가
        if (rows.length > 0) {
            const roomsWithDetails = await Promise.all(
                rows.map(async (room) => {
                    try {
                        // 내 아이디가 아닌 상대방 아이디 구하기
                        const partnerId = room.user_id1 == user_id ? room.user_id2 : room.user_id1;

                        // 파트너 닉네임 조회
                        let partner_nickname = '';
                        try {
                            const partnerUser = await userModel.getUserById(partnerId);
                            partner_nickname = partnerUser?.nick_name || '알 수 없는 유저';
                        } catch (err) {
                            console.error(`채팅방 ${room.chatting_room_id} 상대 닉네임 조회 실패:`, err);
                            partner_nickname = '닉네임 조회 실패';
                        }

                        // 방 제목 조회
                        let title = '';
                        try {
                            title = await this.getTitle(room.post_id, room.type);
                        } catch (err) {
                            console.error(`채팅방 ${room.chatting_room_id} 제목 조회 실패:`, err);
                            title = '제목 조회 실패';
                        }

                        // 방 제목 조회
                        let recentMessage = '';
                        try {
                            recentMessage = await this.getRecentMessage(room.chatting_room_id);
                        } catch (err) {
                            console.error(`채팅방 ${room.chatting_room_id} 제목 조회 실패:`, err);
                            recentMessage = '제목 조회 실패';
                        }

                        // 안읽은 메시지 개수 조회
                        let unreadCount = 0;
                        try {
                            unreadCount = await this.getUnreadMessageCount(user_id, room.chatting_room_id);
                        } catch (err) {
                            console.error(`채팅방 ${room.chatting_room_id} 안읽은 메시지 개수 조회 실패:`, err);
                            unreadCount = 0; // 실패 시 0으로 처리
                        }

                        return {
                            ...room,
                            title: title || '알 수 없는 제목',
                            partnerId,
                            partner_nickname,
                            unreadCount,
                            recentMessage
                        };
                    } catch (err) {
                        console.error(`채팅방 ${room.chatting_room_id} 정보 조회 실패:`, err);
                        return {
                            ...room,
                            title: '제목 조회 실패',
                            partner_nickname: '닉네임 조회 실패',
                            unreadCount: 0,
                            recentMessage: '최근 메시지 조회 실패'
                        };
                    }
                })
            );

            return roomsWithDetails;
        }

        return []; // 조회 결과가 없으면 빈 배열 반환

    } catch (err) {
        console.error('getChattingRooms error:', err);
        throw err;
    } finally {
        if (conn) conn.end();
    }
};

// 안읽은 메시지 개수 조회
exports.getUnreadMessageCount = async (user_id, chatting_room_id) => {
    const conn = await dbconn.init();
    try {
        await dbconn.connect(conn);
        const sql = `
        SELECT COUNT(*) AS count
        FROM message
        WHERE chatting_room_id = ? 
          AND receiver_id = ? 
          AND is_read = 0`;
        const [rows] = await conn.promise().query(sql, [chatting_room_id, user_id]);
        return rows[0]?.count || 0;
    } catch (err) {
        console.error('안읽은 메시지 개수 조회 실패:', err);
        return 0;
    } finally {
        if (conn) conn.end();
    }
};

// 해당 채팅방의 가장 최근 메시지 조회
exports.getRecentMessage = async (chatting_room_id) => {
    const conn = await dbconn.init();
    try {
        await dbconn.connect(conn);
        const sql = `
        SELECT content
        FROM message
        WHERE chatting_room_id = ? 
        ORDER BY created_at DESC
        LIMIT 1`;
        const [rows] = await conn.promise().query(sql, [chatting_room_id]);

        if (!rows || rows.length === 0) return null;

        return rows[0].content;
    } catch (err) {
        console.error('가장 최근 메시지 조회 실패:', err);
        return null;
    } finally {
        if (conn) conn.end();
    }
};

// message_file 테이블에 메시지-파일 연결 정보 저장
exports.insertMessageFile = async (messageId, fileId) => {
    const conn = await dbconn.init();
    await dbconn.connect(conn);
    try {
        const sql = `INSERT INTO message_file (message_id, file_id) VALUES (?, ?)`;
        const [result] = await conn.promise().query(sql, [messageId, fileId]);
        return result;
    } catch (err) {
        console.error('메시지-파일 연결 정보 저장 실패:', err);
        return null;
    } finally {
        if (conn) conn.end();
    }
};
