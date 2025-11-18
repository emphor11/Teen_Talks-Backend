const pool = require("../db")

const findOrCreateConversation =async (userA,userB) =>{
    const user1 = Math.min(userA,userB)
    const user2 = Math.max(userA,userB)

    const existing = await pool.query(`
        SELECT * FROM conversations WHERE user1_id = $1 AND user2_id = $2`,[user1,user2])
    
    if(existing.rows.length >0){
        return existing.rows[0]
    }

    const result = await pool.query(
        `INSERT INTO conversations (user1_id, user2_id)
         VALUES ($1, $2)
         RETURNING *`,
        [user1, user2]
      );
      return result.rows[0];
    
}


const sendMessage = async (conversationId, senderId, content) => {
    const result = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [conversationId, senderId, content]
    );
    return result.rows[0];
};

const getMessages = async (conversationId) => {
    const result = await pool.query(
      `SELECT messages.*, users.name AS sender_name
       FROM messages
       JOIN users ON messages.sender_id = users.id
       WHERE messages.conversation_id = $1
       ORDER BY messages.created_at ASC`,
      [conversationId]
    );
    return result.rows;
  };
  

const getUserConversations = async (userId) => {
    const result = await pool.query(
      `SELECT c.*, 
              u1.name AS user1_name, 
              u2.name AS user2_name
       FROM conversations c
       JOIN users u1 ON c.user1_id = u1.id
       JOIN users u2 ON c.user2_id = u2.id
       WHERE c.user1_id = $1 OR c.user2_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );
    return result.rows;
};


module.exports = {
    findOrCreateConversation,
    sendMessage,
    getMessages,
    getUserConversations
}