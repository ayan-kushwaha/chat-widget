import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Organization } from "@modules/core/organization/Organization.js";
import { Brain } from "@modules/dashboard/brain/models/Brain.js";
import { getOtpEmailTemplate } from "@shared/templates/email/otp-link.template";
import * as nodeCrypto from 'crypto';
const ENCRYPTION_KEY = (process.env.ENCRYPTION_KEY || 'c3a5e8f1b2c3d4e5f6a1b2c3d4e5f6a1').substring(0, 32).padEnd(32, '!');
const IV_LENGTH = 16;

function encrypt(text: string) {
    const iv = nodeCrypto.randomBytes(IV_LENGTH);
    const cipher = nodeCrypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string | null {
    try {
        if (!text || !text.includes(':')) return null; // Not our format
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift()!, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = nodeCrypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString().trim();
    } catch (e) {
        return null; // Wrong key or corrupt — caller handles this
    }
}

// Temporary memory store for OTPs (In production, use Redis)
const otpStore = new Map<string, { otp: string, expiresAt: number, userId: string, orgId: string }>();

export const register = async (email: string, password: string) => {
    // Check if user exists in ANY organization (for now, assuming unique email globally for simplicity, 
    // or we can allow same email in diff orgs but that complicates login)
    const existing = await Organization.findOne({ "users_access.email": email });
    if (existing) throw new Error("User already exists");

    const passwordHash = encrypt(password);

    // Create new Organization (Clean - No Brain Inside)
    const orgName = email.split("@")[0] + "'s Org";
    const newOrg = await Organization.create({
        name: orgName,
        users_access: [{
            userId: `user_${Date.now()}`,
            name: email.split("@")[0],
            email,
            password_hash: passwordHash,
            role: 'owner',
            permissions: ['*']
        }]
    });

    // Create Brain Separately (Linked)
    await Brain.create({
        orgId: newOrg._id,
        personality_config: { name: "Cluaiz Bot" },
        // other defaults handled by Schema or Helper
    });

    const user = newOrg.users_access[0];
    const token = jwt.sign(
        { id: user.userId, orgId: newOrg._id, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: "7d" }
    );

    const userSanitized = {
        userId: user.userId,
        name: user.name,
        email: user.email,
        image: user.image,
        googleId: user.googleId,
        password_hash: decrypt(user.password_hash || ""),
        hasPassword: !!user.password_hash,
        role: user.role,
        secondaryEmail: null
    };

    return { user: userSanitized, token, orgId: newOrg._id };
};

export const login = async (email: string, password: string) => {
    const org = await Organization.findOne({
        $or: [
            { "users_access.email": email },
            { "users_access.secondaryEmail.email": email }
        ]
    });
    if (!org) throw new Error("User not found");

    const user = org.users_access.find((u: any) =>
        u.email === email || (u.secondaryEmail && u.secondaryEmail.email === email)
    );
    if (!user) throw new Error("User not found in org");

    const isSecondary = user.secondaryEmail && user.secondaryEmail.email === email;
    const hashToCompare = isSecondary ? user.secondaryEmail?.password_hash : user.password_hash;

    // Use reversible AES encryption for both primary and secondary based on user request
    let match = false;
    const decrypted = decrypt(hashToCompare || "");
    if (decrypted === password) {
        match = true;
    } else if (hashToCompare) {
        // Fallback for bcrypt transition
        match = await bcrypt.compare(password, hashToCompare);
    }

    if (!match) throw new Error("Invalid password");

    const token = jwt.sign(
        { id: user.userId, orgId: org._id, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: "7d" }
    );

    const userSanitized = {
        userId: user.userId,
        name: user.name,
        email: user.email,
        image: user.image,
        googleId: user.googleId,
        password_hash: decrypt(user.password_hash || ""),
        hasPassword: !!user.password_hash,
        role: user.role,
        secondaryEmail: user.secondaryEmail && user.secondaryEmail.email ? {
            email: user.secondaryEmail.email,
            linkedAt: user.secondaryEmail.linkedAt,
            password_hash: decrypt(user.secondaryEmail.password_hash || ""), // Return original text for secondary
            hasPassword: !!user.secondaryEmail.password_hash
        } : null
    };

    return { user: userSanitized, token, orgId: org._id, is_deleted: org.is_deleted };
};

export const deleteAccount = async (userId: string, orgId: string) => {
    const org = await Organization.findById(orgId);
    if (!org) throw new Error("Organization not found");

    // In a real app, verify userId is owner

    org.is_deleted = true;
    org.deletedAt = new Date();
    await org.save();
    return { message: "Account scheduled for deletion" };
};

export const reactivateAccount = async (orgId: string) => {
    const org = await Organization.findById(orgId);
    if (!org) throw new Error("Organization not found");

    org.is_deleted = false;
    org.deletedAt = undefined;
    await org.save();
    return { message: "Account reactivated" };
};

import * as EmailService from "@shared/services/email.service.js";
import { getPasswordResetEmail } from "@shared/templates/email/password-reset.template.js";
import { getPasswordChangedTemplate } from "@shared/templates/email/password-changed.template.js";

export const forgotPassword = async (email: string) => {
    const org = await Organization.findOne({ "users_access.email": email });
    if (!org) throw new Error("User not found");

    const user = org.users_access.find((u: any) => u.email === email);
    if (!user || !user.email) throw new Error("User not found in org");

    // Generate token
    const resetToken = nodeCrypto.randomBytes(20).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

    // Save token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await org.save();

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    // Use Professional Template
    const htmlMessage = getPasswordResetEmail(resetUrl);
    const textMessage = `Reset your password here: ${resetUrl}`;

    const userEmail = (user.email || "") as string;
    await EmailService.sendEmail(userEmail, 'Password Reset Request', textMessage, htmlMessage, 'noreply');

    return { message: 'Email sent' };
};

export const resetPassword = async (token: string, newPassword: string) => {
    const passwordHash = encrypt(newPassword);

    // Check primary reset token
    const orgPrimary = await Organization.findOne({
        "users_access.resetPasswordToken": token,
        "users_access.resetPasswordExpires": { $gt: Date.now() }
    });

    if (orgPrimary) {
        const user = orgPrimary.users_access.find((u: any) => u.resetPasswordToken === token);
        if (!user) throw new Error("User not found");
        user.password_hash = passwordHash;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        orgPrimary.markModified('users_access');
        await orgPrimary.save();
        return { message: 'Password updated' };
    }

    throw new Error("Password reset token is invalid or has expired");
};

export const sendSecondaryPasswordResetOtp = async (userId: string, orgId: string) => {
    const org = await Organization.findById(orgId);
    if (!org) throw new Error("Organization not found");

    const user = org.users_access.find((u: any) => u.userId === userId);
    if (!user || !user.secondaryEmail?.email) throw new Error("No secondary email linked");

    const email = user.secondaryEmail.email;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(`reset_${email}`, { otp, expiresAt, userId, orgId });

    const htmlMessage = getOtpEmailTemplate(otp);
    const textMessage = `Your OTP to reset your secondary password is: ${otp}. It expires in 10 minutes.`;

    await EmailService.sendEmail(email, 'Secondary Password Reset OTP', textMessage, htmlMessage, 'noreply');

    return { message: 'OTP sent to your secondary email' };
};

export const resetSecondaryPasswordWithOtp = async (userId: string, orgId: string, otp: string, newPassword: string) => {
    const org = await Organization.findById(orgId);
    if (!org) throw new Error("Organization not found");

    const user = org.users_access.find((u: any) => u.userId === userId);
    if (!user || !user.secondaryEmail?.email) throw new Error("No secondary email linked");

    const email = user.secondaryEmail.email;
    const stored = otpStore.get(`reset_${email}`);

    if (!stored) throw new Error("OTP not found or expired. Please request a new one.");
    if (stored.expiresAt < Date.now()) {
        otpStore.delete(`reset_${email}`);
        throw new Error("OTP has expired. Please request a new one.");
    }
    if (stored.otp !== otp) throw new Error("Invalid OTP");
    if (stored.userId !== userId || stored.orgId !== orgId) throw new Error("Unauthorized request");

    // Valid OTP - update password
    const passwordHash = encrypt(newPassword);

    await Organization.updateOne(
        { _id: org._id, 'users_access.userId': userId },
        { $set: { 'users_access.$.secondaryEmail.password_hash': passwordHash } }
    );

    otpStore.delete(`reset_${email}`);

    // Send security notification
    const htmlMessage = getPasswordChangedTemplate(email);
    const textMessage = "Your secondary account password has been changed successfully. If this wasn't you, please contact support immediately.";
    await EmailService.sendEmail(email, 'Secondary Password Changed Successfully', textMessage, htmlMessage, 'noreply');

    return { message: 'Secondary password updated successfully' };
};

export const getMe = async (userId: string, orgId: string) => {
    const org = await Organization.findById(orgId);
    if (!org) throw new Error("Organization not found");
    const user = org.users_access.find((u: any) => u.userId === userId);
    if (!user) throw new Error("User not found");

    const userSanitized = {
        userId: user.userId,
        name: user.name,
        email: user.email,
        image: user.image,
        googleId: user.googleId,
        hasPassword: !!user.password_hash,
        secondaryEmail: user.secondaryEmail && user.secondaryEmail.email ? {
            email: user.secondaryEmail.email,
            linkedAt: user.secondaryEmail.linkedAt,
            hasPassword: !!user.secondaryEmail.password_hash
        } : null
    };
    return { user: userSanitized, orgId: org._id };
};

export const googleLogin = async (email: string, name: string, googleId: string, picture: string) => {
    // 1. Try to find user by primary email or secondary emails
    let org = await Organization.findOne({
        $or: [
            { "users_access.email": email },
            { "users_access.secondaryEmail.email": email }
        ]
    });

    if (!org) {
        // 2. Create New Org if not found
        const orgName = (name || email.split("@")[0]) + "'s Workspace";
        org = await Organization.create({
            name: orgName,
            users_access: [{
                userId: `user_${Date.now()}`,
                name: name || email.split("@")[0],
                email,
                googleId,
                image: picture,
                role: 'owner', // First user is owner
                permissions: ['*'],
                isActive: true
            }]
        });

        // Create Brain Separately
        await Brain.create({
            orgId: org._id,
            personality_config: { name: "Cluaiz Bot" }
        });
    } else {
        // 3. If exists, update googleId and picture if missing
        const user = org.users_access.find((u: any) =>
            u.email === email || (u.secondaryGoogleAccounts && u.secondaryGoogleAccounts.some((sga: any) => sga.email === email))
        );
        if (user) {
            // Check if it's the primary account
            if (user.email === email) {
                if (!user.googleId) user.googleId = googleId;
                if (!user.image) user.image = picture;
            } else {
                // Secondary account matched - don't need to do much unless picture needs update, but we'll leave as is
            }
            await org.save();
        }
    }

    // 3. Login
    const user = org.users_access.find((u: any) =>
        u.email === email || (u.secondaryEmail && u.secondaryEmail.email === email)
    );
    if (!user) throw new Error("User creation failed");

    // 4. Generate Token
    const token = jwt.sign(
        { id: user.userId, orgId: org._id, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: "7d" }
    );

    const userSanitized = {
        userId: user.userId,
        name: user.name,
        email: user.email,
        image: user.image,
        googleId: user.googleId,
        password_hash: decrypt(user.password_hash || ""),
        hasPassword: !!user.password_hash,
        role: user.role,
        secondaryEmail: user.secondaryEmail && user.secondaryEmail.email ? {
            email: user.secondaryEmail.email,
            linkedAt: user.secondaryEmail.linkedAt,
            password_hash: decrypt(user.secondaryEmail.password_hash || ""),
            hasPassword: !!user.secondaryEmail.password_hash
        } : null
    };

    return { user: userSanitized, token, orgId: org._id, is_deleted: org.is_deleted };
};

/**
 * 🔗 Send OTP to link an email to existing account
 */
export const sendLinkEmailOtp = async (userId: string, orgId: string, targetEmail: string) => {
    const org = await Organization.findById(orgId);
    if (!org) throw new Error("Organization not found");

    const user = org.users_access.find((u: any) => u.userId === userId);
    if (!user) throw new Error("User not found");

    // Check if email is already primary or secondary
    if (user.email === targetEmail || (user.secondaryEmail && user.secondaryEmail.email === targetEmail)) {
        throw new Error("This email is already linked to your profile");
    }

    // Check if email is used by another user entirely
    const existing = await Organization.findOne({
        $or: [
            { "users_access.email": targetEmail },
            { "users_access.secondaryEmail.email": targetEmail }
        ]
    });
    if (existing) throw new Error("This email is already associated with an account");

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(targetEmail, { otp, expiresAt, userId, orgId });

    // Send email
    const htmlMessage = getOtpEmailTemplate(otp);
    const textMessage = `Your OTP to link this email to your account is: ${otp}. It expires in 10 minutes.`;

    await EmailService.sendEmail(targetEmail, 'Verify Secondary Email', textMessage, htmlMessage, 'noreply');

    return { message: "OTP sent successfully to " + targetEmail };
};

/**
 * 🔗 Verify OTP to link an email
 */
export const verifyLinkEmailOtp = async (userId: string, orgId: string, targetEmail: string, otp: string) => {
    const stored = otpStore.get(targetEmail);

    if (!stored) throw new Error("OTP not found or expired. Please request a new one.");
    if (stored.expiresAt < Date.now()) {
        otpStore.delete(targetEmail);
        throw new Error("OTP has expired. Please request a new one.");
    }
    if (stored.otp !== otp) throw new Error("Invalid OTP");
    if (stored.userId !== userId || stored.orgId !== orgId) throw new Error("Unauthorized OTP request");

    const org = await Organization.findById(orgId);
    if (!org) throw new Error("Organization not found");

    await Organization.updateOne(
        { _id: org._id, "users_access.userId": userId },
        { $set: { "users_access.$.secondaryEmail": { email: targetEmail, linkedAt: new Date() } } }
    );
    otpStore.delete(targetEmail);

    return { message: "Email successfully linked", email: targetEmail };
};

export const unlinkEmail = async (userId: string, orgId: string) => {
    const org = await Organization.findById(orgId);
    if (!org) throw new Error("Organization not found");

    const user = org.users_access.find((u: any) => u.userId === userId);
    if (!user) throw new Error("User not found");

    if (!user.secondaryEmail) {
        throw new Error("No secondary email found");
    }

    await Organization.updateOne(
        { _id: org._id, "users_access.userId": userId },
        { $unset: { "users_access.$.secondaryEmail": "" } }
    );

    return { message: "Email unlinked successfully" };
};
export const setSecondaryPassword = async (userId: string, orgId: string, passwordData: { current?: string; new: string }) => {
    const org = await Organization.findById(orgId);
    if (!org) throw new Error("Organization not found");

    const user = org.users_access.find((u: any) => u.userId === userId);
    if (!user) throw new Error("User not found");
    if (!user.secondaryEmail || !user.secondaryEmail.email) throw new Error("No secondary email linked");

    // Verify current password if already exists
    if (user.secondaryEmail.password_hash) {
        const currentStored = user.secondaryEmail.password_hash || "";
        const decrypted = decrypt(currentStored); // null = stored with wrong key

        if (decrypted === null) {
            // Can't verify old hash (different encryption key) — just overwrite
        } else {
            if (!passwordData.current) throw new Error("Current password is required");
            const provided = (passwordData.current || "").trim();
            if (provided !== decrypted) {
                const match = await bcrypt.compare(provided, currentStored).catch(() => false);
                if (!match) throw new Error("Incorrect current password");
            }
        }
    }

    const encryptedPass = encrypt(passwordData.new);

    await Organization.updateOne(
        { _id: org._id, 'users_access.userId': userId },
        { $set: { 'users_access.$.secondaryEmail.password_hash': encryptedPass } }
    );

    // Send Security Notification
    const secondaryEmailAddress = user.secondaryEmail.email as string;
    const htmlMessage = getPasswordChangedTemplate(secondaryEmailAddress);
    const textMessage = `Security Alert: The password for your secondary account ${secondaryEmailAddress} has been changed.`;

    await EmailService.sendEmail(secondaryEmailAddress, 'Security Alert: Password Changed', textMessage, htmlMessage, 'noreply');

    return { message: "Secondary password updated" };
};

export const changePassword = async (userId: string, orgId: string, passwordData: { current?: string; new: string }) => {
    const org = await Organization.findById(orgId);
    if (!org) throw new Error("Organization not found");

    const user = org.users_access.find((u: any) => u.userId === userId);
    if (!user) throw new Error("User not found");

    if (user.password_hash) {
        const currentStored = user.password_hash || "";
        const decrypted = decrypt(currentStored); // null = stored with wrong key

        if (decrypted === null) {
            // Can't verify old hash (different encryption key) — just overwrite
        } else {
            if (!passwordData.current) throw new Error("Current password is required");
            const provided = (passwordData.current || "").trim();
            if (provided !== decrypted) {
                const match = await bcrypt.compare(provided, currentStored).catch(() => false);
                if (!match) throw new Error("Incorrect current password");
            }
        }
    }

    const passwordHash = encrypt(passwordData.new);

    await Organization.updateOne(
        { _id: org._id, 'users_access.userId': userId },
        { $set: { 'users_access.$.password_hash': passwordHash } }
    );

    // Send Security Notification
    const userEmail = user.email as string;
    const htmlMessage = getPasswordChangedTemplate(userEmail);
    const textMessage = `Security Alert: The password for your account ${userEmail} has been changed.`;

    await EmailService.sendEmail(userEmail, 'Security Alert: Password Changed', textMessage, htmlMessage, 'noreply');

    return { message: "Password updated successfully" };
};
