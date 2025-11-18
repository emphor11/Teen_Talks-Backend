const express = require("express");
const authMiddleware = require("../middleware/authmiddleware");
const {
  getConversations,
  getMessagesByConversation,
  sendMessageRest,
  getOrCreateConversation,
} = require("../controllers/chatControllers");

const router = express.Router();

// Fetch all conversations for the logged-in user
router.get("/conversations", authMiddleware, getConversations);

// Fetch all messages in a specific conversation
router.get("/messages/:conversationId", authMiddleware, getMessagesByConversation);

// Send a message via REST (for fallback testing)
router.post("/send", authMiddleware, sendMessageRest);
router.get("/start/:receiverId", authMiddleware, getOrCreateConversation);
module.exports = router;
