const dbconn = require("../config/dbconn");

// 채팅 저장
exports.saveMessage = async (senderId, receiverId, content, chatting_room_id) => {
    let conn;
    try {
        conn = await dbconn.init();
        await dbconn.connect(conn);
        const sql = `INSERT INTO message
        (sender_id, receiver_id, content, chatting_room_id)
        VALUES (?, ?, ?, ?)`;
        const result = await conn.promise().query(sql, [senderId, receiverId, content, chatting_room_id])
        return result[0].insertId; // 새로 생성된 메시지 ID 반환
    } catch (err) {
        console.error('saveMessage error:', err);
        throw err;
    } finally {
        if (conn) conn.end();
    }
};

// 채팅 조회
exports.getMessages = async (chatting_room_id) => {
    let conn;
    try {
        conn = await dbconn.init();
        await dbconn.connect(conn);
        const sql = `
        SELECT * 
        FROM message 
        WHERE chatting_room_id = ?
        ORDER BY created_at
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
exports.findOrCreateConversation = async (sender_id, receiver_id, post_id, type) => {
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
