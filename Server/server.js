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

// Build allowed origins list (supports comma-separated CLIENT_ORIGINS and single CLIENT_ORIGIN)
const envOrigins = [
  ...(process.env.CLIENT_ORIGINS ? process.env.CLIENT_ORIGINS.split(",") : []),
  process.env.CLIENT_ORIGIN || "",
]
  .map((o) => o && o.trim())
  .filter(Boolean);

// Helper: allow localhost and Vercel preview domains by default in addition to explicit list
const isOriginAllowed = (origin) => {
  if (!origin) return true; // non-browser or same-origin
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) return true;
  if (/\.vercel\.app$/i.test(origin)) return true; // allow any vercel.app preview/prod
  return envOrigins.includes(origin);
};

// Initialize socket.io server
export const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS (socket.io)"), false);
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// strore online users
export const userSocketMap = {}; // {userId: socketId}

// socket.io connecting handeler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("user Connected", userId);
  if (userId) userSocketMap[userId] = socket.id;

  // emit online users totall connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User Disconnected", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// middleware
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));
const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS (http)"), false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));

// routes
app.use("/api/status", (req, res) => res.send("Server is Live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// start server
const startServer = async () => {
  await connectDB();

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () =>
    console.log("Server is running on port:" + PORT)
  );
};

startServer();
