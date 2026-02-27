import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log("client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("client disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("socket.io not initialized");
  }
  return io;
};
