const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const path = require("path");

require("dotenv").config();

const homeRoutes = require("./routes/home");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const followRoutes = require("./routes/followRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();
app.use(express.json());

// ✅ Allowed frontend origins
const allowedOrigins = [
  "http://localhost:5173",
  "https://teen-talks-frontend-kv7z7y4dh-emphor11s-projects.vercel.app"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200); // Preflight success
  }

  next();
});
// ------- END CORS FIX -------



// -----------------------------------------
// ROUTES
// -----------------------------------------
app.use("/api/v1", homeRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/follow", followRoutes);
app.use("/api/v1/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/v1/chat", chatRoutes);

// -----------------------------------------
// SOCKET.IO SERVER
// -----------------------------------------
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  }
});

// -----------------------------------------
// SOCKET AUTH
// -----------------------------------------
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Auth error: No token"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = { id: decoded.id };
    next();

  } catch (err) {
    next(new Error("Auth error: Invalid token"));
  }
});

// Maps
const userSocketMap = {};
const socketToUserMap = {};

// -----------------------------------------
// SOCKET CONNECTIONS
// -----------------------------------------
io.on("connection", (socket) => {
  const userId = Number(socket.user.id);

  userSocketMap[userId] = socket.id;
  socketToUserMap[socket.id] = userId;

  console.log(`✅ User ${userId} connected (${socket.id})`);

  socket.on("disconnect", () => {
    if (userSocketMap[userId] === socket.id) {
      delete userSocketMap[userId];
    }
    delete socketToUserMap[socket.id];
    console.log(`❌ User ${userId} disconnected`);
  });

  // -----------------------------------------
  // MESSAGE SEND HANDLER
  // -----------------------------------------
  socket.on("sendMessage", async ({ conversationId, receiverId, content }) => {
    try {
      const chatModel = require("./models/Chat");
      const pool = require("./db");

      let conv;

      if (conversationId) {
        const check = await pool.query(
          `SELECT * FROM conversations WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)`,
          [conversationId, userId]
        );

        if (check.rows.length === 0) return;

        conv = check.rows[0];
      } else {
        conv = await chatModel.findOrCreateConversation(userId, receiverId);
      }

      const message = await chatModel.sendMessage(conv.id, userId, content);

      const payload = {
        id: message.id,
        conversation_id: message.conversation_id,
        sender_id: message.sender_id,
        content: message.content,
        created_at: message.created_at,
      };

      // Send to sender (confirmation)
      socket.emit("messageSent", payload);

      const rSocket = userSocketMap[receiverId];

      if (rSocket) {
        io.to(rSocket).emit("newMessage", payload);
      }

    } catch (err) {
      console.error("Message error:", err);
      socket.emit("messageError", { error: "Failed to send message" });
    }
  });
});

// -----------------------------------------
// START SERVER
// -----------------------------------------
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
