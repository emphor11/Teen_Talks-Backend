const express = require("express");
const http = require("http");
const cors = require("cors")
const {Server} = require("socket.io")
const jwt = require("jsonwebtoken")
const homeRoutes =require("./routes/home")
const userRoutes = require("./routes/userRoutes")
const postRoutes =  require("./routes/postRoutes")
const followRoutes = require("./routes/followRoutes")
const chatRoutes = require("./routes/chatRoutes");
const path = require("path")
const app = express();
app.use(express.json())
const allowedOrigins = [
  "http://localhost:5173",
  "https://teen-talks-frontend.onrender.com" // change to your frontend domain
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/api/v1",homeRoutes)
app.use("/api/v1/users",userRoutes)
app.use("/api/v1/posts", postRoutes)
app.use("/api/v1/follow",followRoutes)
app.use("/api/v1/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/v1/chat", chatRoutes);

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  }
});



// Authenticate WebSocket connections
io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        console.error("❌ Socket auth failed: No token provided");
        return next(new Error("Auth error: No token"));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: decoded.id };
      console.log(`🔐 Socket authenticated for user: ${decoded.id}`);
      next();
    } catch (err) {
      console.error("❌ Socket auth failed:", err.message);
      next(new Error("Auth error: Invalid token"));
    }
  });
  
  // Real-time Chat Events - SIMPLIFIED: Just track connected sockets
  const userSocketMap = {}; // Track connected users: { userId: socketId }
  const socketToUserMap = {}; // Track socket to user: { socketId: userId }

io.on("connection", (socket) => {
  const userId = Number(socket.user.id); // Ensure userId is a number
  
  // Store user socket mapping (always update on connection/reconnection)
  userSocketMap[userId] = socket.id;
  socketToUserMap[socket.id] = userId;
  
  console.log(`✅ User ${userId} connected with socket ${socket.id}`);
  console.log(`📋 All connected users:`, Object.keys(userSocketMap).map(Number).join(", "));
  
  // Verify connection immediately
  console.log(`🔌 Socket ${socket.id} verified connected for user ${userId}`);

  // Handle disconnect - SIMPLIFIED: just remove immediately
  socket.on("disconnect", (reason) => {
    console.log(`⚠️ Socket ${socket.id} disconnected for user ${userId} (reason: ${reason})`);
    
    // Remove from maps only if this is still the current socket for this user
    if (userSocketMap[userId] === socket.id) {
      delete userSocketMap[userId];
      console.log(`❌ User ${userId} removed from connected users`);
    }
    delete socketToUserMap[socket.id];
    
    console.log(`📋 Remaining connected users:`, Object.keys(userSocketMap).map(Number).join(", "));
  });

  // Handle connection errors
  socket.on("error", (error) => {
    console.error(`❌ Socket error for user ${userId}:`, error);
  });

  // ✅ Handle message send
  socket.on("sendMessage", async ({ conversationId, receiverId, content }) => {
    if (!receiverId || !content) {
      console.error("❌ Missing receiverId or content");
      return;
    }
    
    try {
      const chatModel = require("./models/Chat");
      let conv;
      
      // Use provided conversationId if available, otherwise find/create
      if (conversationId) {
        // Validate the conversation exists and user is part of it
        const pool = require("./db");
        const convCheck = await pool.query(
          `SELECT * FROM conversations WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)`,
          [conversationId, userId]
        );
        
        if (convCheck.rows.length > 0) {
          conv = convCheck.rows[0];
        } else {
          console.error("❌ Conversation not found or user not authorized");
          return;
        }
      } else {
        // Find or create conversation if no ID provided
        conv = await chatModel.findOrCreateConversation(userId, receiverId);
      }
      
      // Save message to database
      const message = await chatModel.sendMessage(conv.id, userId, content);
      
      console.log("✅ Message saved:", { id: message.id, conversation_id: message.conversation_id, sender_id: message.sender_id });

      const payload = {
        id: message.id,
        conversation_id: message.conversation_id,
        sender_id: message.sender_id,
        content: message.content,
        created_at: message.created_at,
      };

      // SIMPLIFIED MESSAGE DELIVERY: Always try to send to receiver
      const receiverIdNum = Number(receiverId);
      const receiverSocketId = userSocketMap[receiverIdNum];
      
      console.log(`📤 Sending message from user ${userId} to user ${receiverIdNum}`);
      console.log(`📋 Connected users:`, Object.keys(userSocketMap).map(Number).join(", "));
      
      // ALWAYS emit to sender first (optimistic UI)
      socket.emit("messageSent", payload);
      console.log(`✅ Confirmed to sender ${userId}`);
      
      // Try to send to receiver - if they're connected, send immediately
      if (receiverSocketId) {
        // Check if socket is still connected
        const receiverSocket = io.sockets.sockets.get(receiverSocketId);
        console.log(`🔍 Checking receiver socket - ID: ${receiverSocketId}, Socket exists: ${!!receiverSocket}, Connected: ${receiverSocket?.connected}`);
        
        if (receiverSocket && receiverSocket.connected) {
          console.log(`📨 ✅ Sending to receiver ${receiverIdNum} via socket ${receiverSocketId}`);
          console.log(`📨 Payload being sent:`, JSON.stringify(payload, null, 2));
          receiverSocket.emit("newMessage", payload);
          console.log(`✅✅ Message delivered in REAL-TIME to user ${receiverIdNum}`);
          console.log(`✅✅ Event 'newMessage' emitted to socket ${receiverSocketId}`);
        } else {
          // Socket in map but not actually connected - remove it
          console.log(`⚠️ Socket ${receiverSocketId} in map but not connected, removing...`);
          delete userSocketMap[receiverIdNum];
          console.log(`📝 Message saved to DB - receiver ${receiverIdNum} will load it on next fetch`);
        }
      } else {
        // Receiver not in map - they're not connected
        console.log(`❌ Receiver ${receiverIdNum} NOT IN MAP - not connected`);
        console.log(`📋 Current connected users:`, Object.keys(userSocketMap).map(Number).join(", "));
        console.log(`📝 Message saved to DB - receiver will see it when they open the chat`);
      }
    } catch (err) {
      console.error("💥 Chat error:", err);
      socket.emit("messageError", { error: "Failed to send message" });
    }
  });
});


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});