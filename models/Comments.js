const pool = require('../db')

const addComment = async (userId, postId, content) => {
    const result = await pool.query(
      `INSERT INTO comments (user_id, post_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, postId, content]
    );
    return result.rows[0];
};

const getCommentsByPost = async (postId) => {
    const result = await pool.query(
      `SELECT comments.*, users.name AS user_name
       FROM comments
       JOIN users ON comments.user_id = users.id
       WHERE post_id = $1
       ORDER BY comments.created_at DESC`,
      [postId]
    );
    return result.rows;
  };

const deleteComment = async (commentId, userId) => {
const result = await pool.query(
    `DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING *`,
    [commentId, userId]
);
return result.rows[0];
};


module.exports = { addComment, getCommentsByPost, deleteComment };