const express = require("express");
const { signup, signin, profile, googleLogin } = require("../controllers/authControllers");
const authMiddleware = require("../middleware/authmiddleware");
const router = express.Router();

router.post("/signup",signup)
router.post("/signin",signin)
router.get("/profile",authMiddleware,profile)
router.post("/google-login", googleLogin);


module.exports = router