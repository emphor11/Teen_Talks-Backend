const express = require("express")
const authMiddleware = require("../middleware/authmiddleware")
const { getUserById, profile_pic } = require("../controllers/userController")
const upload = require("../middleware/uploadMiddleware")
const router = express.Router()



router.get("/:userId",authMiddleware,getUserById)
router.post("/profile-pic",upload.single("profilePic"),authMiddleware,profile_pic)
module.exports = router;