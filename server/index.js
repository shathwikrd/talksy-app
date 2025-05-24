import dotenv from "dotenv";
import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import userRouter from "./routes/user.route.js";
import getSentimentEmoji from "./utils/sentimentUtil.js";
import askBot from "./utils/googleAI.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error", err));

app.use("/auth", userRouter);

const users = {};

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error"));
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET_USER);
    socket.userId = user.id;
    socket.username = user.username;
    next();
  } catch (error) {
    console.error("Socket auth error:", error.message);
    return next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.username}`);

  users[socket.id] = {
    userId: socket.userId,
    username: socket.username,
  };

  io.emit(
    "userList",
    Object.values(users).map((u) => u.username)
  );

  socket.on("message", async ({ content }) => {
    const emoji = getSentimentEmoji(content);
    io.emit("message", {
      sender: socket.username,
      content: `${emoji} ${content}`,
      isBot: false,
    });

    if (content.startsWith("/bot")) {
      const question = content.replace("/bot", "").trim();
      const botReply = await askBot(question);
      io.emit("message", {
        sender: "🤖 Bot",
        content: botReply,
        isBot: true,
      });
    }
  });

  socket.on("privateMessage", ({ toUsername, content }) => {
    const entry = Object.entries(users).find(
      ([, u]) => u.username === toUsername
    );
    if (!entry) return;
    const [targetId] = entry;

    io.to(targetId).emit("privateMessage", {
      from: socket.username,
      content,
    });
  });

  socket.on("typing", () => {
    socket.broadcast.emit("typing", socket.username);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.username}`);
    delete users[socket.id];
    io.emit(
      "userList",
      Object.values(users).map((u) => u.username)
    );
  });
});

const PORT = process.env.PORT;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
