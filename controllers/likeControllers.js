const { toggleLike, countLikes } = require("../models/Likes");
const pool = require("../db"); // adjust path if needed

const handleLike = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.userId;

    const result = await toggleLike(userId, postId);
    const likeCount = await countLikes(postId);

    console.log("Like API:", { postId, userId, ...result, likeCount });

    res.json({
      success: true,
      liked: result.liked,
      count: parseInt(likeCount, 10),
    });
  } catch (err) {
    console.error("Like Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getLikes = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.userId;

    console.log("🔍 getLikes called for postId:", postId, "user:", userId);

    const likeCount = await countLikes(postId);

    // 🆕 Check if the user has liked this post
    const likedResult = await pool.query(
      "SELECT 1 FROM likes WHERE user_id = $1 AND post_id = $2",
      [userId, postId]
    );
    const liked = likedResult.rowCount > 0;

    console.log("✅ countLikes:", likeCount, "liked:", liked);

    res.json({
      success: true,
      postId,
      likeCount: parseInt(likeCount, 10),
      liked, // 👈 include this
    });
  } catch (err) {
    console.error("Get Likes Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { handleLike, getLikes };
