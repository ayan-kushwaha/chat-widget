//libs/sokekts
import { Server as SocketIOServer } from "socket.io";
import http from "http";

let io: SocketIOServer | null = null;

export const initSocket = (server: http.Server) => {
    if (io) return io;

    io = new SocketIOServer(server, {
        cors: {
            origin: ["http://localhost:5173", "*"],
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // AUTH MIDDLEWARE
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;

        if (token !== process.env.WORKER_SOCKET_TOKEN) {
            console.log("❌ INVALID WORKER TOKEN:", token);
            return next(new Error("NO_AUTH"));
        }

        console.log("🔐 WORKER AUTH OK");
        next();
    });

    io.on("connection", (socket) => {
        console.log("⚡ Socket connected");

        socket.on("join-site-room", (siteId) => {
            socket.join(`site-${siteId}`);
            console.log(`📡 Joined room: site-${siteId}`);
        });

        socket.on("leave-site-room", (siteId) => {
            socket.leave(`site-${siteId}`);
        });
    });

    console.log("💬 Socket.IO Server initialized");
    return io;
};

export const getIO = () => {
    if (!io) throw new Error("Socket.IO not initialized");
    return io;
};
