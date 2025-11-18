const express = require("express")
const authMiddleware = require("../middleware/authmiddleware")

const { unfollowUser, followUser, getFollowers, getFollowing, isFollowing } = require("../controllers/followController");
const router = express.Router()


router.post("/:userId",authMiddleware,followUser);
router.delete("/:userId",authMiddleware,unfollowUser);
router.get("/followers/:userId",getFollowers);
router.get("/following/:userId",getFollowing);
router.get("/status/:userId", authMiddleware,isFollowing);

module.exports = router;