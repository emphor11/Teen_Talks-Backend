const chatModel = require("../models/Chat");

const getConversations = async (req, res) => {
  try {
    const conversations = await chatModel.getUserConversations(req.userId);
    res.json({conversations})
    console.log("convoc",conversations)
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getMessagesByConversation = async (req, res) => {
  try {
    const messages = await chatModel.getMessages(req.params.conversationId);
    console.log("mess",messages)
    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const sendMessageRest = async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    // Basic validation
    if (!conversationId || !content) {
      return res.status(400).json({ message: "Missing data" });
    }

    // ✅ No need to find/create — use the given conversationId
    const message = await chatModel.sendMessage(conversationId, req.userId, content);

    console.log("✅ Message sent:", message);
    res.status(201).json(message);
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { receiverId } = req.params;
    if (!receiverId) return res.status(400).json({ message: "Missing receiverId" });

    const chatModel = require("../models/Chat");
    const conv = await chatModel.findOrCreateConversation(userId, parseInt(receiverId));
    console.log("conv",conv)
    // get partner info
    const pool = require("../db");
    const partnerId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
    const partnerRes = await pool.query("SELECT id, name, profile_pic FROM users WHERE id = $1", [partnerId]);
    const partner = partnerRes.rows[0];
    console.log("partner",partner)
    res.json({
      conversation: {
        id: conv.id,
        partner,
      },
    });
  } catch (err) {
    console.error("getOrCreateConversation error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getConversations,
  getMessagesByConversation,
  sendMessageRest,
  getOrCreateConversation
};
