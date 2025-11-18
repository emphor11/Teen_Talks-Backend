const pool = require("../db")


const createPost = async (userId, content, mediaUrl = null) => {
  const result = await pool.query(
    `INSERT INTO posts (user_id, content, media_url)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, content, mediaUrl]
  );
  return result.rows[0];
};

const getAllPosts = async () => {
  const result = await pool.query(
    `SELECT 
  p.id,
  p.user_id,
  p.content,
  p.media_url,
  p.created_at,

  -- like count
  COALESCE(like_count.count, 0) AS likes_count,

  -- comments aggregated as JSON array
  COALESCE(
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', c.id,
        'content', c.content,
        'created_at', c.created_at,
        'user', JSON_BUILD_OBJECT('id', cu.id, 'name', cu.name)
      )
    ) FILTER (WHERE c.id IS NOT NULL),
    '[]'
  ) AS comments

FROM posts p

-- likes subquery
LEFT JOIN (
  SELECT post_id, COUNT(*) AS count
  FROM likes
  GROUP BY post_id
) like_count ON like_count.post_id = p.id

-- comments join
LEFT JOIN comments c ON c.post_id = p.id
LEFT JOIN users cu ON c.user_id = cu.id

GROUP BY p.id, like_count.count
ORDER BY p.created_at DESC;

    `

  );
  return result.rows;
};


const getPostById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM posts WHERE id = $1",
    [id]
  )
  return result.rows[0]
}

const getPostsByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT id, content, media_url, created_at
     FROM posts
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};


module.exports = { createPost, getAllPosts, getPostById ,getPostsByUserId}
