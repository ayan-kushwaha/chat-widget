import { Organization } from "@modules/core/organization/Organization.js";
import { sendEmail } from "@shared/services/email.service.js";

export const getTeamMembers = async (orgId: string) => {
    const org = await Organization.findById(orgId);
    if (!org) throw new Error("Organization not found");

    return {
        members: org.users_access.map((user: any) => ({
            userId: user.userId,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image,
            permissions: user.permissions,
            googleId: user.googleId,
            hasPassword: !!user.password_hash,
            isActive: user.isActive !== false,
            invitedAt: user.invitedAt
        })),
        orgName: org.name
    };
};

export const addTeamMember = async (orgId: string, email: string, role: string, name?: string, invitedBy?: string) => {
    const org = await Organization.findById(orgId);
    if (!org) throw new Error("Organization not found");

    // Check if user already exists in this organization
    const existingUserInOrg = org.users_access.find((u: any) => u.email === email);
    if (existingUserInOrg) throw new Error("User already exists in this organization");

    // Check if user exists in Cluaiz (Global Check)
    const userExistsGlobally = await Organization.findOne({ "users_access.email": email });
    if (!userExistsGlobally) {
        throw new Error("User not registered on Cluaiz. Please ask them to sign up first.");
    }

    // Validate role
    const validRoles = ['owner', 'admin', 'manager', 'employee', 'viewer'];
    if (!validRoles.includes(role)) throw new Error("Invalid role");

    // Add new user (Directly Active since they are an existing user)
    const newUser = {
        userId: `user_${Date.now()}`,
        name: name || email.split('@')[0],
        email,
        role,
        permissions: role === 'owner' ? ['*'] : [],
        isActive: true, // Auto-active
        invitedAt: new Date(),
        invitedBy
    };

    // Save user first
    org.users_access.push(newUser);
    await org.save();

    // Send Notification Email (No activation needed)
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;

    const emailText = `You have been added to ${org.name} as ${role}. Log in to your dashboard: ${dashboardUrl}`;

    const emailHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Welcome to ${org.name}!</h2>
            <p>You have been added to the team as a <strong>${role}</strong>.</p>
            <p>Since you already have a Cluaiz account, you can simply log in and switch to this organization.</p>
            <a href="${dashboardUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                Go to Dashboard
            </a>
            <p>Thanks,<br><strong>The Cluaiz Team</strong></p>
        </div>
    `;

    try {
        await sendEmail(email, `You joined ${org.name} on Cluaiz`, emailText, emailHtml);
        console.log(`✅ Notification email sent to ${email}`);
        return { user: newUser, message: 'Member added successfully.' };
    } catch (error: any) {
        console.error('❌ Failed to send notification email:', error.message);
        return { user: newUser, message: 'Member added but email failed.' };
    }
};

export const updateMemberRole = async (orgId: string, userId: string, newRole: string, requestingUserId: string) => {
    const org = await Organization.findById(orgId);
    if (!org) throw new Error("Organization not found");

    const user = org.users_access.find((u: any) => u.userId === userId);
    if (!user) throw new Error("User not found");

    const requestingUser = org.users_access.find((u: any) => u.userId === requestingUserId);
    if (!requestingUser) throw new Error("Requesting user not found");

    // Validate role
    const validRoles = ['owner', 'admin', 'manager', 'employee', 'viewer'];
    if (!validRoles.includes(newRole)) throw new Error("Invalid role");

    // Security checks
    if (user.userId === requestingUserId && user.role === 'owner') {
        throw new Error("Owner cannot change their own role");
    }

    if (newRole === 'owner' && requestingUser.role !== 'owner') {
        throw new Error("Only owner can assign owner role");
    }

    if (user.role === 'owner' && newRole !== 'owner') {
        const ownerCount = org.users_access.filter((u: any) => u.role === 'owner').length;
        if (ownerCount <= 1) {
            throw new Error("Cannot demote the last owner");
        }
    }

    user.role = newRole as 'owner' | 'admin' | 'manager' | 'employee' | 'viewer';
    user.permissions = newRole === 'owner' ? ['*'] : [];

    await org.save();

    return { user };
};

export const removeMember = async (orgId: string, userId: string, requestingUserId: string) => {
    const org = await Organization.findById(orgId);
    if (!org) throw new Error("Organization not found");

    const userIndex = org.users_access.findIndex((u: any) => u.userId === userId);
    if (userIndex === -1) throw new Error("User not found");

    const user = org.users_access[userIndex];
    const requestingUser = org.users_access.find((u: any) => u.userId === requestingUserId);

    if (userId === requestingUserId) {
        throw new Error("Cannot remove yourself from the organization");
    }

    if (user.role === 'owner') {
        const ownerCount = org.users_access.filter((u: any) => u.role === 'owner').length;
        if (ownerCount <= 1) {
            throw new Error("Cannot remove the last owner");
        }
    }

    if (requestingUser && !['owner', 'admin'].includes(requestingUser.role)) {
        throw new Error("Only owner or admin can remove members");
    }

    org.users_access.splice(userIndex, 1);
    await org.save();

    return { message: 'User removed successfully' };
};

export const activateAccount = async (token: string, password: string) => {
    // Deprecated for existing users, but kept for backward compatibility if needed
    // Or we can just remove it if we are strictly enforcing existing users only.
    // For now, I'll keep it but it won't be used by the new addTeamMember flow.
    const org = await Organization.findOne({ "users_access.activationToken": token });
    if (!org) throw new Error("Invalid activation token");

    const user = org.users_access.find((u: any) => u.activationToken === token);
    if (!user) throw new Error("Invalid activation token");

    if (user.activationExpires && new Date() > new Date(user.activationExpires)) {
        throw new Error("Activation token has expired");
    }

    const bcrypt = await import('bcrypt');
    user.password_hash = await bcrypt.hash(password, 10);
    user.isActive = true;
    user.activationToken = undefined;
    user.activationExpires = undefined;

    await org.save();

    return {
        message: 'Account activated successfully',
        user: {
            userId: user.userId,
            name: user.name,
            email: user.email,
            role: user.role
        }
    };
};
