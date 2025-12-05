const express = require("express")
const authMiddleware = require("../middleware/authmiddleware")
const { addPost, getPost, fetchPostById, getMyPost ,deletePost} = require("../controllers/postControllers")
const { handleLike, getLikes } = require("../controllers/likeControllers")
const { createComment, fetchComments, removeComment } = require("../controllers/commentControllers")
const upload = require("../middleware/uploadMiddleware")

const router = express.Router()

router.post("/",authMiddleware,upload.single("media"), addPost)
router.get("/feed",authMiddleware, getPost)
router.get("/:id",fetchPostById)
router.get("/my-posts",authMiddleware,getMyPost)
router.delete("/:postId", authMiddleware, deletePost)

router.post("/:postId/like",authMiddleware, handleLike)
router.get("/:postId/like",authMiddleware, getLikes)

router.post("/comments/:postId",authMiddleware,createComment)
router.get("/comments/:postId",fetchComments)
router.delete("/comments/:commentId", authMiddleware,removeComment)

module.exports = router

