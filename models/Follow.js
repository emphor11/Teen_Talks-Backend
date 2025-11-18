const pool = require("../db")

const followUser = async (followerId, followingId) => {
    return await pool.query(
      `INSERT INTO follows (follower_id, following_id)
       VALUES ($1, $2)
       ON CONFLICT (follower_id, following_id) DO NOTHING`,
      [followerId, followingId]
    );
  };

const unfollowUser = async (followerId, followingId) => {
return await pool.query(
    `DELETE FROM follows WHERE follower_id = $1 AND following_id = $2`,
    [followerId, followingId]
);
};

const getFollowers = async (userId) => {
    const result = await pool.query(
      `SELECT users.id, users.name, users.email
       FROM follows
       JOIN users ON follows.follower_id = users.id
       WHERE follows.following_id = $1`,
      [userId]
    );
    return result.rows;
  };

const getFollowing = async (userId) => {
const result = await pool.query(
    `SELECT users.id, users.name, users.email
    FROM follows
    JOIN users ON follows.following_id = users.id
    WHERE follows.follower_id = $1`,
    [userId]
);
return result.rows;
};

const checkFollowing = async (followerId, followingId) => {
    const result = await pool.query(
      `SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2`,
      [followerId, followingId]
    );
    return result.rowCount > 0;
  };

module.exports = {
    followUser,
    unfollowUser,getFollowers,
    getFollowing,checkFollowing
}


  