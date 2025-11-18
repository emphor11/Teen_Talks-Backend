const followModel = require("../models/Follow");

// ➤ Follow a user
const followUser = async (req, res) => {
  const followerId = req.userId; // from JWT
  const followingId = parseInt(req.params.userId);
  console.log(followerId,followingId)

  if (followerId === followingId)
    return res.status(400).json({ message: "You cannot follow yourself" });

  try {
    await followModel.followUser(followerId, followingId);
    res.json({ isFollowing: true, message: "User followed successfully" });
  } catch (error) {
    console.error("Follow Error:", error.message);
    res.status(500).json({ message: "Server error while following user" });
  }
};

// ➤ Unfollow a user
const unfollowUser = async (req, res) => {
  const followerId = req.userId;
  const followingId = parseInt(req.params.userId);

  try {
    await followModel.unfollowUser(followerId, followingId);
    res.json({ isFollowing: false, message: "User unfollowed successfully" });
  } catch (error) {
    console.error("Unfollow Error:", error.message);
    res.status(500).json({ message: "Server error while unfollowing user" });
  }
};

// ➤ Get followers list
const getFollowers = async (req, res) => {
  const userId = parseInt(req.params.userId);

  try {
    const followers = await followModel.getFollowers(userId);
    res.status(200).json(followers);
  } catch (error) {
    console.error("Get Followers Error:", error.message);
    res.status(500).json({ message: "Server error fetching followers" });
  }
};

// ➤ Get following list
const getFollowing = async (req, res) => {
  const userId = parseInt(req.params.userId);

  try {
    const following = await followModel.getFollowing(userId);
    res.status(200).json(following);
  } catch (error) {
    console.error("Get Following Error:", error.message);
    res.status(500).json({ message: "Server error fetching following list" });
  }
};

// ➤ Check if following
const isFollowing = async (req, res) => {
  const followerId = req.userId; // Use req.userId from auth middleware, not req.user.id
  const followingId = parseInt(req.params.userId);

  if (isNaN(followingId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const following = await followModel.checkFollowing(followerId, followingId);
    res.status(200).json({ isFollowing: following });
  } catch (error) {
    console.error("Check Following Error:", error.message);
    res.status(500).json({ message: "Error checking follow status" });
  }
};

module.exports = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  isFollowing
};
