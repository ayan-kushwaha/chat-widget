"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { LogOut, Save, Pencil, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { logout } from "@/store/slices/authSlice";
import { signOut, useSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { changePassword, setSecondaryPassword, sendLinkEmailOtp, verifyLinkEmailOtp, unlinkEmailAccount, sendSecondaryPasswordResetOtp, resetSecondaryPasswordWithOtp, deleteAccount, getMe } from '@/api/auth.api';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
    AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getOrg, updateOrgSettings, updateUserName } from "@/api/org.api";
import { PageWrapper, ScrollableContent } from "@/components/layout/PageWrapper";
import { PageHeader } from "@/components/layout/PageHeader";
import { BusinessProfileView } from "./components/BusinessProfileView";

export default function OrganizationSettingsPage() {
    const { data: session } = useSession();
    const userState = useSelector((state: RootState) => state.auth.user);
    const dispatch = useDispatch();
    const router = useRouter();

    // Base user/org data from DB
    const [userId, setUserId] = useState("");
    const [orgId, setOrgId] = useState("");
    const [orgData, setOrgData] = useState<any>({});
    const [userData, setUserData] = useState({ name: "", email: "", avatar: "", hasGoogle: false, hasPassword: false, password_hash: "", secondaryEmail: null as any });

    const [loading, setLoading] = useState(false);

    // Edit modes
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Draft data used during edit mode
    const [draftOrgData, setDraftOrgData] = useState<any>({});
    const [draftUserData, setDraftUserData] = useState<any>({});
    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });

    const refreshData = useCallback(async () => {
        try {
            const token = (session as any)?.accessToken;
            const data = await getMe(token);
            if (data.success) {
                setUserId(data.user.userId);
                setOrgId(data.orgId);
                setUserData({
                    name: data.user.name || "",
                    email: data.user.email || "",
                    avatar: data.user.image || session?.user?.image || "",
                    hasGoogle: !!data.user.googleId,
                    hasPassword: data.user.hasPassword,
                    password_hash: data.user.password_hash,
                    secondaryEmail: data.user.secondaryEmail || null
                });

                const orgRes = await getOrg();
                if (orgRes.success) {
                    const org = orgRes.organizations.find((o: any) => o.id === data.orgId);
                    if (org) {
                        setOrgData(org);
                        if (org.userImage) {
                            setUserData(prev => ({ ...prev, avatar: org.userImage }));
                        }
                    }
                }
            }
        } catch {
            if (userState) {
                setUserData(prev => ({ ...prev, name: userState.name || "", email: userState.email || "" }));
            } else if (session?.user) {
                setUserData(prev => ({ ...prev, name: session.user.name || "", email: session.user.email || "" }));
            }
        }
    }, [session, userState]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    const handleLogout = async () => {
        dispatch(logout());
        await signOut({ redirect: false });
        router.push("/login");
    };

    // Handlers for Email Linking are defined inline within onUserChange below

    const handleDeleteAccount = async () => {
        try {
            setLoading(true);
            if (!orgId) return toast.error("Organization ID not found");
            await deleteAccount(userId, orgId);
            toast.success("Account scheduled for deletion");
            handleLogout();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete account");
        } finally { setLoading(false); }
    };

    const handleEditStart = () => {
        setDraftOrgData(JSON.parse(JSON.stringify(orgData)));
        setDraftUserData({ ...userData });
        setPasswords({ current: userData.password_hash || "", new: "", confirm: "" });
        setIsEditing(true);
    };

    const handleEditCancel = () => {
        setIsEditing(false);
        setDraftOrgData({});
        setDraftUserData({});
    };

    const handleSave = async () => {
        // 1. Validate password if user attempted to change it
        if (passwords.new || passwords.confirm || passwords.current) {
            if (passwords.new !== passwords.confirm) {
                return toast.error("Passwords do not match");
            }
            if (passwords.new.length < 6) {
                return toast.error("Password must be at least 6 characters");
            }
        }

        try {
            setIsSaving(true);
            const results: string[] = [];
            const errors: string[] = [];

            // 2. Save Org Settings
            try {
                const orgPayload = {
                    name: draftOrgData.name,
                    accountType: draftOrgData.accountType,
                    logo: draftOrgData.logo,
                    bannerImage: draftOrgData.bannerImage,
                    tagline: draftOrgData.tagline,
                    businessDescription: draftOrgData.businessDescription,
                    businessModel: draftOrgData.businessModel,
                    subCategory: draftOrgData.subCategory,
                    targetAudience: draftOrgData.targetAudience,
                    primaryGoal: draftOrgData.primaryGoal,
                    heroOffering: draftOrgData.heroOffering,
                    aiConstitution: draftOrgData.aiConstitution,
                    aiRestrictions: draftOrgData.aiRestrictions,
                    policies: draftOrgData.policies,
                    communicationTone: draftOrgData.communicationTone,
                    companySize: draftOrgData.companySize,
                    foundedYear: draftOrgData.foundedYear,
                    industry: draftOrgData.industry,
                    contactPhone: draftOrgData.contactPhone,
                    contactEmail: draftOrgData.contactEmail,
                    website: draftOrgData.website,
                    contactChannels: draftOrgData.contactChannels,
                    socialLinks: draftOrgData.socialLinks,
                    operatingHours: draftOrgData.operatingHours,
                    businessAddress: draftOrgData.businessAddress,
                    onboardingCompleted: true,
                };
                await updateOrgSettings(orgPayload);
                results.push("Business profile");
                // Commit org draft
                setOrgData((prev: any) => ({ ...prev, ...orgPayload }));
            } catch (err: any) {
                const msg = err?.response?.data?.message || "Failed to save business profile";
                console.error("Org settings save error:", err?.response?.data || err);
                errors.push(`Business: ${msg}`);
            }

            // 3. Save User Name (if changed)
            if (draftUserData.name && draftUserData.name !== userData.name && userId && orgId) {
                try {
                    await updateUserName(orgId, userId, draftUserData.name);
                    results.push("User name");
                } catch (err: any) {
                    const msg = err?.response?.data?.message || "Failed to update name";
                    console.error("User name save error:", err?.response?.data || err);
                    errors.push(`Name: ${msg}`);
                }
            }

            // 4. Save Primary Password (if new filled)
            if (passwords.new && (!userData.hasPassword || passwords.current)) {
                try {
                    await changePassword(passwords.new, passwords.current);
                    results.push("Password");
                    setPasswords({ current: "", new: "", confirm: "" });
                } catch (err: any) {
                    const msg = err?.response?.data?.message || "Failed to update password";
                    console.error("Password save error:", err?.response?.data || err);
                    errors.push(`Password: ${msg}`);
                }
            }

            // 5. Done — re-fetch from server so view mode shows actual DB data
            if (errors.length === 0) {
                toast.success("All settings saved! ✅");
                setIsEditing(false);
                await refreshData();
            } else if (results.length > 0) {
                toast.success(`Saved: ${results.join(", ")}`);
                toast.error(`Issues: ${errors.join(" | ")}`);
                setIsEditing(false);
                await refreshData();
            } else {
                toast.error(errors.join(" | "));
            }
        } catch (err: any) {
            console.error("Save error:", err);
            toast.error(err?.response?.data?.message || "Failed to save. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <PageWrapper>
            <PageHeader
                title="Settings ⚙️"
                description="Manage your profile and business information."
                actions={
                    <div className="flex items-center gap-2">
                        {isEditing ? (
                            <>
                                <Button variant="outline" onClick={handleEditCancel} disabled={isSaving}>
                                    <X className="mr-2 h-4 w-4" /> Cancel
                                </Button>
                                <Button onClick={handleSave} disabled={isSaving}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {isSaving ? "Saving..." : "Save Profile"}
                                </Button>
                            </>
                        ) : (
                            <Button variant="outline" onClick={handleEditStart}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit Profile
                            </Button>
                        )}
                    </div>
                }
            />
            <ScrollableContent>
                <div className="space-y-6 max-w-4xl mx-auto">
                    {/* ── BUSINESS IDENTITY BANNER (top, always visible if incomplete) ── */}
                    {!orgData?.onboardingCompleted && !isEditing && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40 px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">⚡</span>
                                    <div>
                                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Complete your Business Identity</p>
                                        <p className="text-xs text-amber-700 dark:text-amber-400">Your AI employees need this info to work effectively for your business.</p>
                                    </div>
                                </div>
                                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
                                    onClick={handleEditStart}>
                                    Complete Now
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── UNIFIED PROFILE CARD ── */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}>
                        <BusinessProfileView
                            org={isEditing ? draftOrgData : orgData}
                            user={isEditing ? draftUserData : userData}
                            isEditing={isEditing}
                            onUserChange={async (key, val) => {
                                if (key === "passwords") {
                                    setPasswords(val);
                                } else if (key === "setPrimaryPassword") {
                                    try {
                                        await changePassword(val.new, val.current);
                                        toast.success("Password saved! ✅");
                                        setDraftUserData((prev: any) => ({ ...prev, hasPassword: true }));
                                        await refreshData();
                                    } catch (err: any) {
                                        toast.error(err?.response?.data?.message || "Failed to save password");
                                        throw err;
                                    }
                                } else if (key === "sendLinkOtp") {
                                    try {
                                        await sendLinkEmailOtp(val);
                                    } catch (err: any) {
                                        toast.error(err?.response?.data?.message || "Failed to send OTP");
                                        throw err;
                                    }
                                } else if (key === "verifyLinkOtp") {
                                    try {
                                        await verifyLinkEmailOtp(val.email, val.otp);
                                        toast.success("Secondary email linked! ✅");
                                        setDraftUserData((prev: any) => ({
                                            ...prev,
                                            secondaryEmail: { email: val.email, linkedAt: new Date().toISOString() }
                                        }));
                                    } catch (err: any) {
                                        toast.error(err?.response?.data?.message || "Failed to verify OTP");
                                        throw err;
                                    }
                                } else if (key === "unlinkEmail") {
                                    try {
                                        await unlinkEmailAccount();
                                        toast.success("Secondary email unlinked!");
                                        setDraftUserData((prev: any) => ({
                                            ...prev,
                                            secondaryEmail: null
                                        }));
                                    } catch (err: any) {
                                        toast.error(err?.response?.data?.message || "Failed to unlink email");
                                        throw err;
                                    }
                                } else if (key === "setSecondaryPassword") {
                                    try {
                                        await setSecondaryPassword(val.new, val.current);
                                        toast.success("Secondary password updated!");
                                        setDraftUserData((prev: any) => ({
                                            ...prev,
                                            secondaryEmail: { ...prev.secondaryEmail, hasPassword: true }
                                        }));
                                        await refreshData();
                                    } catch (err: any) {
                                        toast.error(err?.response?.data?.message || "Failed to update secondary password");
                                        throw err;
                                    }
                                } else if (key === "sendSecondaryResetOtp") {
                                    try {
                                        await sendSecondaryPasswordResetOtp();
                                        toast.success("OTP sent to your secondary email!");
                                    } catch (err: any) {
                                        toast.error(err?.response?.data?.message || "Failed to send reset OTP");
                                        throw err;
                                    }
                                } else if (key === "resetSecondaryWithOtp") {
                                    try {
                                        await resetSecondaryPasswordWithOtp(val.otp, val.new);
                                        toast.success("Secondary password reset successfully! ✅");
                                        setDraftUserData((prev: any) => ({
                                            ...prev,
                                            secondaryEmail: { ...prev.secondaryEmail, hasPassword: true }
                                        }));
                                        await refreshData();
                                    } catch (err: any) {
                                        toast.error(err?.response?.data?.message || "Failed to reset password");
                                        throw err;
                                    }
                                } else {
                                    setDraftUserData((prev: any) => ({ ...prev, [key]: val }));
                                }
                            }}
                            onOrgChange={(key, val) => {
                                setDraftOrgData((prev: any) => ({ ...prev, [key]: val }));
                            }}
                        />
                    </motion.div>

                    {/* ── DANGER ZONE (Logout + Delete) ── */}
                    {!isEditing && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <Card className="border-red-200 dark:border-red-900 mt-8">
                                <CardHeader>
                                    <CardTitle className="text-red-600 dark:text-red-400 mb-2">Danger Zone</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button
                                        onClick={handleLogout}
                                        variant="outline"
                                        className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" /> Logout
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400">
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Your account will be scheduled for deletion in 30 days. You can restore it by logging back in.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700 text-white">
                                                    {loading ? "Deleting..." : "Yes, Delete Account"}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </div>
            </ScrollableContent>
        </PageWrapper>
    );
}
