"use client";

import React, { useState, useEffect } from 'react';
import { useOrg } from '@/context/OrgContext';
import { updateOrgSettings } from '@/api/org.api';
import { toast } from 'sonner';
import { SettingSection, SettingItem } from './SharedComponents';
import { Mail, ShieldAlert, Users, Lock, Fingerprint } from 'lucide-react';

export const SecuritySettings: React.FC = () => {
    // Access Control State
    const { activeOrg, refreshOrgs } = useOrg();
    const [strictMode, setStrictMode] = useState(activeOrg?.access_control?.mode === 'strict');
    const [googleLogin, setGoogleLogin] = useState(true);
    const [microsoftLogin, setMicrosoftLogin] = useState(false);
    const [emailMagicLink, setEmailMagicLink] = useState(true);

    // Sync strictMode with activeOrg changes
    useEffect(() => {
        setStrictMode(activeOrg?.access_control?.mode === 'strict');
    }, [activeOrg?.access_control?.mode]);

    const handleAccessControlToggle = async () => {
        const newMode = strictMode ? 'guest' : 'strict';
        setStrictMode(!strictMode);

        try {
            await updateOrgSettings({
                access_control: {
                    mode: newMode
                }
            });
            await refreshOrgs();
            toast.success(`Access Control: ${newMode === 'strict' ? 'Strict Mode Enabled' : 'Guest Mode Enabled'}`);
        } catch (error) {
            setStrictMode(!strictMode); // Revert on error
            toast.error('Failed to update access control settings');
        }
    };

    return (
        <div className="space-y-8">
            <SettingSection title="Global Safeguard">
                <SettingItem
                    label="Strict Identity Mode"
                    description="Force users to authenticate before accessing sensitive AI triggers."
                    toggle
                    active={strictMode}
                    onToggle={handleAccessControlToggle}
                    icon={Lock}
                />
            </SettingSection>

            <SettingSection title="Verification Hub">
                <div className="space-y-4 p-2">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <span className="text-xl font-bold">G</span>
                            </div>
                            <div>
                                <div className="text-sm font-bold text-white">Google SSO</div>
                                <div className="text-[10px] text-zinc-500">Enable 1-tap login for verified Google accounts.</div>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={googleLogin}
                            onChange={() => setGoogleLogin(!googleLogin)}
                            className="w-5 h-5 accent-emerald-500"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                <Mail size={20} />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-white">Magic Email Links</div>
                                <div className="text-[10px] text-zinc-500">Passwordless login via secure email verification code.</div>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={emailMagicLink}
                            onChange={() => setEmailMagicLink(!emailMagicLink)}
                            className="w-5 h-5 accent-emerald-500"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all group opacity-50">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-zinc-500/10 flex items-center justify-center text-zinc-500">
                                <Fingerprint size={20} />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-white">Biometric Login</div>
                                <div className="text-[10px] text-zinc-500">FaceID or Fingerprint (Enterprise only).</div>
                            </div>
                        </div>
                        <div className="text-[8px] font-black bg-zinc-800 text-zinc-500 px-2 py-1 rounded uppercase tracking-tighter">Coming Soon</div>
                    </div>
                </div>
            </SettingSection>

            <SettingSection title="Permissions & Hierarchy">
                <div className="p-6 bg-black/40 border border-white/5 rounded-[1.5rem] flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <Users size={32} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wider mb-1">Advanced Role Mapping</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
                            Define which members can edit training data, view financials, or manage staff permissions.
                        </p>
                        <button className="mt-3 text-[10px] font-bold text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-widest">Manage All Roles →</button>
                    </div>
                </div>
            </SettingSection>
        </div>
    );
};
