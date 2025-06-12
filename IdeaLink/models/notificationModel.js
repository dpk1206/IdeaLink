const dbconn = require("../config/dbconn");

// 알림 생성
exports.createNotification = async (user_id, sender_id, type, target_id, content) => {
    const conn = await dbconn.init();
    try {
        await dbconn.connect(conn);
        const sql = `
        INSERT INTO notification 
            (user_id, sender_id, type, target_id, content) 
        VALUES (?, ?, ?, ?, ?)`;
        const [result] = await conn.promise().query(sql, [user_id, sender_id, type, target_id, content]);
        return result.insertId;
    } catch (err) {
        console.error('알림 생성 실패:', err);
        throw err; // 또는 return null; (상황에 따라 선택)
    } finally {
        if (conn) conn.end();
    }
};

// 알림 조회
exports.getNotificationsByUserId = async (user_id) => {
    const conn = await dbconn.init();
    try {
        await dbconn.connect(conn);

        // 1. 모든 알림 조회 (최신순)
        const [allNotifications] = await conn.promise().query(`
            SELECT * 
            FROM notification 
            WHERE user_id = ? 
            ORDER BY created_at DESC`,
            [user_id]
        );

        // 2. 채팅 알림 중복 제거 (같은 채팅방의 최신 알림만 남김)
        const uniqueNotifications = [];
        const seenChatRooms = new Set(); // 중복 체크용 Set

        allNotifications.forEach(notification => {
            if (notification.type === 'chat') {
                if (!seenChatRooms.has(notification.target_id)) {
                    seenChatRooms.add(notification.target_id);
                    uniqueNotifications.push(notification);
                }
            } else {
                uniqueNotifications.push(notification);
            }
        });

        // 3. 채팅방별 안읽은 알림 개수 조회
        const chatRoomIds = Array.from(seenChatRooms);
        let unreadCounts = new Map();

        if (chatRoomIds.length > 0) {
            // 안읽은 알림 개수 조회
            const [countRows] = await conn.promise().query(`
                SELECT target_id, COUNT(*) AS count 
                FROM notification 
                WHERE 
                    user_id = ? 
                    AND type = 'chat' 
                    AND target_id IN (?) 
                    AND is_read = 0 
                GROUP BY target_id`,
                [user_id, chatRoomIds]
            );
            // Map으로 변환: { target_id → count }
            countRows.forEach(row => {
                unreadCounts.set(row.target_id, row.count);
            });

            // 채팅방 정보 일괄 조회
            const [chatRooms] = await conn.promise().query(`
                SELECT chatting_room_id, post_id, type 
                FROM chatting_room 
                WHERE chatting_room_id IN (?)`,
                [chatRoomIds]
            );
            // 채팅방 정보 매핑 테이블 생성
            const chatRoomMap = new Map();
            chatRooms.forEach(room => {
                chatRoomMap.set(room.chatting_room_id, {
                    post_id: room.post_id,
                    post_type: room.type
                });
            });

            // 4. 최종 알림 목록에 추가 정보 병합
            return uniqueNotifications.map(notification => {
                if (notification.type === 'chat') {
                    const roomInfo = chatRoomMap.get(notification.target_id) || {};
                    return {
                        ...notification,
                        unreadCount: unreadCounts.get(notification.target_id) || 0,
                        post_id: roomInfo.post_id,
                        post_type: roomInfo.post_type
                    };
                }
                return notification;
            });
        }

        // 채팅 알림이 없으면 그냥 반환
        return uniqueNotifications;

    } catch (err) {
        console.error('알림 조회 실패:', err);
        return [];
    } finally {
        if (conn) conn.end();
    }
};

// 안 읽은 알림 갯수 조회
exports.getUnreadNotificationCount = async (user_id) => {
    const conn = await dbconn.init();
    try {
        await dbconn.connect(conn);
        const sql = `
        SELECT COUNT(*) AS unread_count 
        FROM notification 
        WHERE user_id = ? AND is_read = 0`;
        const [rows] = await conn.promise().query(sql, [user_id]);
        return rows[0]?.unread_count || 0;
    } catch (err) {
        console.error('알림 개수 조회 실패:', err);
        return 0; // 오류 시 0 반환
    } finally {
        if (conn) conn.end();
    }
};

// 알림 읽음 처리
exports.markAsRead = async (notification_id, type, user_id) => {
    const conn = await dbconn.init();
    try {
        await dbconn.connect(conn);
        if (type == 'chat') {
            console.log('aaaaaaaaaaa')
            const sql = `
            UPDATE notification n1
            JOIN notification n2 ON n1.target_id = n2.target_id
            SET n1.is_read = 1
            WHERE 
            n2.notification_id = ? 
            AND n1.user_id = ? 
            AND n1.type = 'chat'`;
            const [result] = await conn.promise().query(sql, [notification_id, user_id]);
            return result.affectedRows > 0;
        } else {
            const sql = `
            UPDATE notification 
            SET is_read = 1 
            WHERE notification_id = ?`;
            const [result] = await conn.promise().query(sql, [notification_id]);
            return result.affectedRows > 0;
        }
    } catch (err) {
        console.error('알림 읽음 처리 실패:', err);
        return false; // 오류 시 false 반환
    } finally {
        if (conn) conn.end();
    }
};

// 모든 알림 읽음 처리
exports.markAllAsRead = async (user_id) => {
    const conn = await dbconn.init();
    try {
        await dbconn.connect(conn);
        const sql = `
        UPDATE notification 
        SET is_read = 1 
        WHERE user_id = ?`;
        const [result] = await conn.promise().query(sql, [user_id]);
        return result.affectedRows > 0;
    } catch (err) {
        console.error('모든 알림 읽음 처리 실패:', err);
        return false; // 오류 시 false 반환
    } finally {
        if (conn) conn.end();
    }
};

// 알림 삭제
exports.deleteNotification = async (notification_id) => {
    const conn = await dbconn.init();
    try {
        await dbconn.connect(conn);
        const sql = `DELETE FROM notification WHERE notification_id = ?`;
        const [result] = await conn.promise().query(sql, [notification_id]);
        return result.affectedRows > 0;
    } catch (err) {
        console.error('알림 삭제 실패:', err);
        return false; // 오류 시 false 반환
    } finally {
        if (conn) conn.end();
    }
};

// 모든 알림 삭제
exports.deleteAllNotifications = async (user_id) => {
    const conn = await dbconn.init();
    try {
        await dbconn.connect(conn);
        const sql = `DELETE FROM notification WHERE user_id = ?`;
        const [result] = await conn.promise().query(sql, [user_id]);
        return result.affectedRows > 0;
    } catch (err) {
        console.error('모든 알림 삭제 실패:', err);
        return false; // 오류 시 false 반환
    } finally {
        if (conn) conn.end();
    }
};

// 페이지네이션 추가 시 (limit, offset)
exports.getNotificationsWithPagination = async (user_id, limit, offset) => {
    const conn = await dbconn.init();
    try {
        await dbconn.connect(conn);
        const sql = `
        SELECT * 
        FROM notification 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?`;
        const [rows] = await conn.promise().query(sql, [user_id, limit, offset]);
        return rows;
    } catch (err) {
        console.error('페이지네이션 알림 조회 실패:', err);
        return []; // 오류 시 빈 배열 반환
    } finally {
        if (conn) conn.end();
    }
};

// 채팅방에 대한 안읽은 알림이 있는지 확인
exports.hasUnreadChatNotification = async (user_id, chatting_room_id) => {
    const conn = await dbconn.init();
    try {
        await dbconn.connect(conn);
        const sql = `
        SELECT COUNT(*) AS count 
        FROM notification 
        WHERE user_id = ? 
          AND target_id = ? 
          AND type = 'chat' 
          AND is_read = 0`;
        const [rows] = await conn.promise().query(sql, [user_id, chatting_room_id]);
        return rows[0]?.count > 0;
    } catch (err) {
        console.error('알림 조회 실패:', err);
        return false;
    } finally {
        if (conn) conn.end();
    }
};
