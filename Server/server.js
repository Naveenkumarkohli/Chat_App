import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./Routes/userRoutes.js";
import messageRouter from "./Routes/messageRoute.js";
import { Server } from "socket.io";

// create app
const app = express();
const server = http.createServer(app);

// Initialize socket.io server
export const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || "*" }
})

// strore online users
export const userSocketMap = {}; // {userId: socketId}

// socket.io connecting handeler
io.on("connection", (socket)=>{
  const userId = socket.handshake.query.userId;
  console.log("user Connected", userId);
  if(userId) userSocketMap[userId] = socket.id;

  // emit online users totall connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect",()=>{
    console.log("User Disconnected",userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap))
    
  })
})

// middleware
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));
const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || true, // set your deployed frontend origin
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: false,
};
app.use(cors(corsOptions));

// routes
app.use("/api/status", (req, res) => res.send("Server is Live"));
app.use("/api/auth", userRouter);
app.use("/api/messages",messageRouter)

// start server
const startServer = async () => {
  await connectDB();

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () =>
    console.log("Server is running on port:" + PORT)
  );
};

startServer();
