import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { analysisQueue } from "../jobs/queues.js";

// Handlers
import { registerChatHandlers } from "./handlers/chatHandler.js";
import { registerAgentHandlers } from "./handlers/agentHandler.js";
import { registerHistoryHandlers } from "./handlers/historyHandler.js";
import { registerStatusHandlers } from "./handlers/statusHandler.js";
import { registerCallHandlers } from "./handlers/callHandler.js";
import { registerIdentityHandlers } from "./handlers/identityHandler.js";

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                callback(null, true);
            },
            methods: ["GET", "POST"],
            credentials: true
        },
    });

    io.on("connection", (socket: Socket) => {
        console.log(`🔌 Socket Connected: ${socket.id}`);

        // Register All Modular Handlers
        registerIdentityHandlers(io, socket);
        registerChatHandlers(io, socket);
        registerAgentHandlers(io, socket);
        registerHistoryHandlers(io, socket);
        registerStatusHandlers(io, socket);
        registerCallHandlers(io, socket);

        socket.on("disconnect", async () => {
            console.log(`❌ Socket Disconnected: ${socket.id}`);
            const orgId = socket.data.orgId;
            const conversationId = socket.data.conversationId;

            if (orgId && conversationId) {
                // Trigger Post-Chat Processing
                await analysisQueue.add("analyze-chat", {
                    chatId: conversationId,
                    orgId
                }, { removeOnComplete: true });
            }
        });
    });

    console.log("✅ Socket.io Initialized (Modular Core)");
    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
