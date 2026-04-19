import { Server, Socket } from "socket.io";
import mongoose from "mongoose";

export const registerStatusHandlers = (io: Server, socket: Socket) => {
    // 🟢 STATUS FEATURES (Widget Stories)
    socket.on("get_active_statuses", async (data: { orgId: string }) => {
        const { orgId } = data;
        if (!orgId) return;

        try {
            const { BusinessStatus } = await import("../../models/BusinessStatus.js");

            const statuses = await BusinessStatus.find({
                organizationId: orgId,
                endTime: { $gt: new Date() }
            }).sort({ createdAt: -1 });

            socket.emit("active_statuses", {
                statuses: statuses.map(s => ({
                    id: s._id,
                    type: s.type,
                    content: s.content,
                    styling: s.styling,
                    timestamp: s.createdAt,
                    userName: "Assistant",
                    userAvatar: "bot",
                    music: s.music,
                    musicVolume: s.musicVolume,
                    views: s.views?.length || 0
                }))
            });

        } catch (err) {
            console.error("❌ Status Fetch Error:", err);
            socket.emit("active_statuses", { statuses: [] });
        }
    });

    socket.on("view_status", async (data: { statusId: string, orgId: string }) => {
        const { statusId, orgId } = data;
        if (!statusId) return;

        try {
            const { BusinessStatus } = await import("../../models/BusinessStatus.js");
            // 🟢 Update View Count & Return New Doc
            const updatedStatus = await BusinessStatus.findByIdAndUpdate(statusId, {
                $addToSet: { views: new mongoose.Types.ObjectId() } // Add unique Interaction
            }, { new: true }); // Return updated doc

            if (updatedStatus && orgId) {
                // 📢 Notify Dashboard of View Increment
                io.to(orgId).emit("status_view_updated", {
                    statusId: updatedStatus._id,
                    views: updatedStatus.views?.length || 0
                });
            }
        } catch (err) {
            console.error("❌ Status View Update Error:", err);
        }
    });
};
