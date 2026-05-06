import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      path: "/socket.io",
      withCredentials: true,
      autoConnect: true,
    });
  }
  return socket;
}

export function joinSession(sessionId: number) {
  getSocket().emit("session:join", sessionId);
}

export function leaveSession(sessionId: number) {
  getSocket().emit("session:leave", sessionId);
}

export function joinSupervisorRoom() {
  getSocket().emit("supervisor:join");
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
