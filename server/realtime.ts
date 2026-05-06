import { Server as SocketIOServer, Socket } from "socket.io";
import type { Server as HttpServer } from "http";
import { verifyToken } from "./auth.js";

export type SocketEventType =
  | "message:new"        // New message posted to session feed
  | "turn:changed"       // Turn advanced to a different player
  | "session:updated"    // Session status/metadata changed
  | "player:joined"      // Player joined the session
  | "player:left"        // Player left or was kicked
  | "player:presence"    // Heartbeat / online status
  | "notification:new";  // New supervisor notification

export interface SessionEvent {
  type: SocketEventType;
  sessionId: number;
  payload: unknown;
}

let io: SocketIOServer | null = null;

export function initSocketIO(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN ?? "*",
      credentials: true,
    },
    path: "/socket.io",
  });

  io.use((socket, next) => {
    // Authenticate via JWT cookie or auth token in handshake
    const token =
      socket.handshake.auth?.token ??
      socket.handshake.headers?.cookie
        ?.split(";")
        .find((c) => c.trim().startsWith("rfu_session="))
        ?.split("=")[1];

    if (!token) {
      // Allow unauthenticated connections for public session viewing
      socket.data.user = null;
      return next();
    }

    const user = verifyToken(token);
    socket.data.user = user;
    next();
  });

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user;

    // Join a session room
    socket.on("session:join", (sessionId: number) => {
      socket.join(`session:${sessionId}`);
      if (user) {
        socket.to(`session:${sessionId}`).emit("player:presence", {
          type: "player:presence",
          sessionId,
          payload: { userId: user.id, username: user.username, displayName: user.displayName, online: true },
        });
      }
    });

    // Leave a session room
    socket.on("session:leave", (sessionId: number) => {
      socket.leave(`session:${sessionId}`);
      if (user) {
        socket.to(`session:${sessionId}`).emit("player:presence", {
          type: "player:presence",
          sessionId,
          payload: { userId: user.id, username: user.username, displayName: user.displayName, online: false },
        });
      }
    });

    // Supervisor joins their notification room
    socket.on("supervisor:join", () => {
      if (user?.role === "admin" || user) {
        socket.join(`supervisor:${user.id}`);
      }
    });

    socket.on("disconnect", () => {
      // Broadcast offline presence to all session rooms the socket was in
      if (user) {
        socket.rooms.forEach((room) => {
          if (room.startsWith("session:")) {
            const sessionId = parseInt(room.split(":")[1]);
            socket.to(room).emit("player:presence", {
              type: "player:presence",
              sessionId,
              payload: { userId: user.id, username: user.username, displayName: user.displayName, online: false },
            });
          }
        });
      }
    });
  });

  return io;
}

/** Broadcast an event to all sockets in a session room */
export function emitToSession(sessionId: number, event: SessionEvent) {
  io?.to(`session:${sessionId}`).emit(event.type, event);
}

/** Send a notification to a specific supervisor */
export function emitToSupervisor(supervisorId: number, event: SessionEvent) {
  io?.to(`supervisor:${supervisorId}`).emit(event.type, event);
}

/** Broadcast to all connected clients (e.g. system announcements) */
export function emitGlobal(eventType: string, payload: unknown) {
  io?.emit(eventType, payload);
}

export { io };
