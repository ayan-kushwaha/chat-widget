"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Mail, Shield, MoreVertical, Trash2, UserCog, AlertTriangle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { getTeamMembers, addTeamMember, updateMemberRole, removeMember } from "@/api/team.api";
import { useRBAC } from "@/hooks/useRBAC";
import { useOrg } from "@/context/OrgContext";
import { ROLES } from "@/config/permissions";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { UpgradePrompt } from "@/components/UpgradePrompt";

interface TeamMember {
    userId: string;
    name: string;
    email: string;
    role: string;
    image?: string;
    googleId?: string;
    hasPassword: boolean;
}

const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
        case ROLES.OWNER:
            return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
        case ROLES.ADMIN:
            return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
        case ROLES.MANAGER:
            return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
        case ROLES.EMPLOYEE:
            return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
        case ROLES.VIEWER:
            return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400";
        default:
            return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400";
    }
};

export default function TeamRolesPage() {
    const { data: session } = useSession();
    const { activeOrgId, userRoleInActiveOrg, activeOrgName, organizations } = useOrg();
    const { can, canActOnMember, canAssignRole, userRole, userId } = useRBAC();
    const { canAddTeamMember, currentPlan, planName } = usePlanLimits();

    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
    const [upgradeMessage, setUpgradeMessage] = useState("");

    // form state
    const [newEmail, setNewEmail] = useState("");
    const [newName, setNewName] = useState("");
    const [newRole, setNewRole] = useState<string>(ROLES.EMPLOYEE);
    const [changeRole, setChangeRole] = useState<string>("");

    const activeOrg = organizations.find(o => o.id === activeOrgId);

    // Privacy Logic
    const canViewEmails = userRole === ROLES.OWNER || userRole === ROLES.ADMIN;
    // Filter out Owner from the list
    const displayedMembers = members.filter(m => m.role.toLowerCase() !== ROLES.OWNER);

    useEffect(() => {
        if (activeOrgId) {
            fetchTeamMembers();
        }
    }, [activeOrgId]);

    const fetchTeamMembers = async () => {
        try {
            setLoading(true);
            const token = (session as any)?.accessToken;
            const data = await getTeamMembers(token);
            if (data.success) {
                setMembers(data.members);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to fetch team members");
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async () => {
        if (!can("INVITE_MEMBER")) {
            toast.error("You don't have permission to invite members");
            return;
        }

        // Check plan limit
        const limitCheck = canAddTeamMember(members.length);
        if (!limitCheck.canUse) {
            setUpgradeMessage(`Your ${planName} plan is limited to ${limitCheck.limit} team members. Upgrade to add more.`);
            setShowUpgradePrompt(true);
            return;
        }

        if (!newEmail) {
            toast.error("Email is required");
            return;
        }
        try {
            const token = (session as any)?.accessToken;
            const data = await addTeamMember(newEmail, newRole, newName, token);
            if (data.success) {
                toast.success("Team member added successfully");
                setIsAddDialogOpen(false);
                setNewEmail("");
                setNewName("");
                setNewRole(ROLES.EMPLOYEE);
                fetchTeamMembers();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to add team member");
        }
    };

    const handleChangeRole = async () => {
        if (!selectedMember || !changeRole) return;

        if (!canActOnMember(selectedMember.userId, selectedMember.role, "changeRole")) {
            toast.error("You don't have permission to change this member's role");
            return;
        }

        if (!canAssignRole(changeRole)) {
            toast.error(`You don't have permission to assign ${changeRole} role`);
            return;
        }

        try {
            const token = (session as any)?.accessToken;
            const data = await updateMemberRole(selectedMember.userId, changeRole, token);
            if (data.success) {
                toast.success("Role updated successfully");
                setIsRoleDialogOpen(false);
                setSelectedMember(null);
                setChangeRole("");
                fetchTeamMembers();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update role");
        }
    };

    const handleRemoveMember = async (member: TeamMember) => {
        if (!canActOnMember(member.userId, member.role, "remove")) {
            toast.error("You don't have permission to remove this member");
            return;
        }
        try {
            const token = (session as any)?.accessToken;
            const data = await removeMember(member.userId, token);
            if (data.success) {
                toast.success("Member removed successfully");
                fetchTeamMembers();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to remove member");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                            Team &amp; Roles 👥
                        </h2>
                        <Badge variant="outline" className="text-sm font-medium border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                            Your Role: {userRoleInActiveOrg ? userRoleInActiveOrg.charAt(0).toUpperCase() + userRoleInActiveOrg.slice(1) : 'Viewer'}
                        </Badge>
                    </div>
                    <p className="text-neutral-500 dark:text-neutral-400">
                        Manage team members and their permissions.
                    </p>
                </div>
                {can("INVITE_MEMBER") && (
                    <Button
                        className="bg-blue-600 text-white hover:bg-blue-700"
                        onClick={() => setIsAddDialogOpen(true)}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Invite Member
                    </Button>
                )}
            </div>

            {/* Org Details Card (Replaces Owner in List) */}
            <Card className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                <CardContent className="flex items-center gap-4 p-6">
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        {activeOrgName?.charAt(0).toUpperCase() || <Building2 className="h-8 w-8" />}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                            {activeOrgName || "Organization"}
                        </h3>
                        <p className="text-sm text-neutral-500">
                            Organization Owner &bull; {activeOrg?.plan || "Free"} Plan
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Plan Limit Alert */}
            {members.length >= canAddTeamMember(members.length).limit && (
                <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                Plan Limit Reached
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                                <p>
                                    You have reached the maximum of {canAddTeamMember(members.length).limit} members for the {planName} plan.
                                    Upgrade to Business plan to add more members.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Team Members List */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Team Members</CardTitle>
                            <CardDescription>{displayedMembers.length} members</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8 text-neutral-500">Loading...</div>
                            ) : (
                                <div className="space-y-4">
                                    {displayedMembers.length === 0 ? (
                                        <div className="text-center py-8 text-neutral-500">
                                            No other team members found.
                                        </div>
                                    ) : (
                                        displayedMembers.map((member, index) => (
                                            <motion.div
                                                key={member.userId}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className={`flex items-center justify-between rounded-lg border p-4 ${member.userId === userId
                                                    ? "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10"
                                                    : "border-neutral-200 dark:border-neutral-800"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-12 w-12">
                                                        <AvatarImage src={member.image} />
                                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                                            {member.name?.charAt(0)?.toUpperCase() || "U"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <h3 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                                                            {member.name}
                                                            {member.userId === userId && (
                                                                <Badge variant="secondary" className="text-[10px] h-5">You</Badge>
                                                            )}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                                                            <Mail className="h-3 w-3" />
                                                            {canViewEmails ? member.email : "••••••••••••"}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Badge className={getRoleBadgeColor(member.role)}>{member.role}</Badge>

                                                    {/* Only show actions if user can act on this member */}
                                                    {(canActOnMember(member.userId, member.role, "changeRole") || canActOnMember(member.userId, member.role, "remove")) && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                {canActOnMember(member.userId, member.role, "changeRole") && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setSelectedMember(member);
                                                                            setChangeRole(member.role);
                                                                            setIsRoleDialogOpen(true);
                                                                        }}
                                                                    >
                                                                        <UserCog className="mr-2 h-4 w-4" /> Change Role
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {canActOnMember(member.userId, member.role, "remove") && (
                                                                    <DropdownMenuItem className="text-red-600" onClick={() => handleRemoveMember(member)}>
                                                                        <Trash2 className="mr-2 h-4 w-4" /> Remove
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Roles & Permissions */}
                <div className="space-y-6">
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Roles &amp; Permissions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-purple-600" />
                                        <span className="font-semibold text-neutral-900 dark:text-white">Owner</span>
                                    </div>
                                    <p className="text-xs text-neutral-500">
                                        Full access. Billing, Delete Org, Manage Team.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-blue-600" />
                                        <span className="font-semibold text-neutral-900 dark:text-white">Admin</span>
                                    </div>
                                    <p className="text-xs text-neutral-500">
                                        Manage Team & Bots. No Billing access.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-green-600" />
                                        <span className="font-semibold text-neutral-900 dark:text-white">Manager</span>
                                    </div>
                                    <p className="text-xs text-neutral-500">
                                        Train Bots, Manage Flows, View Analytics.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-orange-600" />
                                        <span className="font-semibold text-neutral-900 dark:text-white">Employee</span>
                                    </div>
                                    <p className="text-xs text-neutral-500">
                                        Work on Inbox & Leads. No Settings access.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-neutral-600" />
                                        <span className="font-semibold text-neutral-900 dark:text-white">Viewer</span>
                                    </div>
                                    <p className="text-xs text-neutral-500">
                                        Read-only access to Dashboards.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>

            {/* Add Member Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invite Team Member</DialogTitle>
                        <DialogDescription>Add a new member to your organization</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="member@example.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Name (Optional)</Label>
                            <Input id="name" placeholder="John Doe" value={newName} onChange={e => setNewName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={newRole} onValueChange={setNewRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(ROLES)
                                        .filter((role: string) => canAssignRole(role) && role !== ROLES.OWNER)
                                        .map((role: string) => (
                                            <SelectItem key={role} value={role}>
                                                {role.charAt(0).toUpperCase() + role.slice(1)}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-neutral-500">
                                Only roles available in your {(currentPlan as any).name} plan are shown.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddMember}>Add Member</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Change Role Dialog */}
            <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Role</DialogTitle>
                        <DialogDescription>Update {selectedMember?.name}'s role</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="change-role">New Role</Label>
                            <Select value={changeRole} onValueChange={setChangeRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(ROLES)
                                        .filter((role: string) => canAssignRole(role) && role !== ROLES.OWNER)
                                        .map((role: string) => (
                                            <SelectItem key={role} value={role}>
                                                {role.charAt(0).toUpperCase() + role.slice(1)}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleChangeRole}>Update Role</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Upgrade Prompt */}
            <UpgradePrompt
                open={showUpgradePrompt}
                onClose={() => setShowUpgradePrompt(false)}
                feature="Team Members"
                currentPlan={planName}
                message={upgradeMessage}
                suggestedPlans={['Pro', 'Business', 'Enterprise']}
            />
        </div>
    );
}
