const dbconn = require("../config/dbconn");

exports.saveMessage = async (senderId, receiverId, content) => {
    const conn = await dbconn.init();
    await dbconn.connect(conn);
    const sql = `INSERT INTO message (sender_id, receiver_id, content) VALUES (?, ?, ?)`;
    return conn.promise().query(sql, [senderId, receiverId, content]);
};

exports.getMessages = async (userId, partnerId) => {
    const conn = await dbconn.init();
    await dbconn.connect(conn);
    const sql = `
    SELECT * FROM message 
    WHERE (sender_id = ? AND receiver_id = ?) 
       OR (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at
  `;
    const [rows] = await conn.promise().query(sql, [userId, partnerId, partnerId, userId]);
    return rows;
};