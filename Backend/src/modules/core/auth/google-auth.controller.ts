import { Request, Response } from "express";
import { Organization } from "@modules/core/organization/Organization.js";
import jwt from "jsonwebtoken";

export const googleAuth = async (req: Request, res: Response) => {
    try {
        const { email, name, googleId, picture } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        // Check if user already exists
        let org = await Organization.findOne({ "users_access.email": email });

        if (org) {
            // User exists - update Google ID and image
            const user = org.users_access.find((u: any) => u.email === email);
            if (user) {
                let updated = false;
                if (googleId && user.googleId !== googleId) {
                    user.googleId = googleId;
                    updated = true;
                }
                if (picture && user.image !== picture) {
                    user.image = picture;
                    updated = true;
                }
                if (updated) {
                    await org.save();
                }
            }
        } else {
            // Create new organization for Google user
            const orgName = name ? `${name}'s Org` : `${email.split("@")[0]}'s Org`;
            org = await Organization.create({
                name: orgName,
                users_access: [{
                    userId: `user_${Date.now()}`,
                    name: name || email.split("@")[0],
                    email,
                    googleId,
                    image: picture,
                    role: 'owner',
                    permissions: ['*']
                }]
            });

            // Create Brain Separately (Linked)
            const { Brain } = await import("@modules/dashboard/brain/models/Brain.js");
            await Brain.create({
                orgId: org._id,
                personality_config: { name: "Cluaiz Bot" }
            });
        }

        // Find the user inside the organization
        const user = org.users_access.find((u: any) => u.email === email);
        if (!user) {
            // This should not happen, but handle gracefully
            return res.status(500).json({ success: false, message: "User record not found after organization lookup" });
        }

        // Update googleId and image if missing (already handled earlier)
        // Generate JWT token
        const token = jwt.sign(
            { id: user.userId, email: user.email, orgId: org._id, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: "7d" }
        );

        // Respond with user data including image
        res.json({
            success: true,
            user: {
                id: user.userId,
                name: user.name,
                email: user.email,
                role: user.role,
                orgId: org._id,
                image: user.image,
                googleId: user.googleId,
                hasPassword: !!user.password_hash
            },
            token,
            orgId: org._id,
            is_deleted: org.is_deleted
        });
    } catch (err: any) {
        console.error("Google auth error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
