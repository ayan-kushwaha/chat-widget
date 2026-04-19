"use client";

import React from 'react';
import { SettingSection, SettingItem } from './SharedComponents';
import { Bell, Mail, Monitor, Volume2, Clock } from 'lucide-react';

export const NotificationsSettings: React.FC = () => {
    const [desktopAlerts, setDesktopAlerts] = React.useState(true);
    const [soundEnabled, setSoundEnabled] = React.useState(true);
    const [emailDigest, setEmailDigest] = React.useState('daily');
    const [marketingSms, setMarketingSms] = React.useState(false);

    return (
        <div className="space-y-8">
            <SettingSection title="Direct Engagement">
                <SettingItem
                    label="Desktop Notifications"
                    description="Receive real-time alerts on your device for new messages."
                    toggle
                    active={desktopAlerts}
                    onToggle={() => setDesktopAlerts(!desktopAlerts)}
                    icon={Monitor}
                />
                <SettingItem
                    label="Sound Alerts"
                    description="Play a subtle chime when an AI response is generated."
                    toggle
                    active={soundEnabled}
                    onToggle={() => setSoundEnabled(!soundEnabled)}
                    icon={Volume2}
                />
            </SettingSection>

            <SettingSection title="Email Intelligence">
                <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Clock size={16} className="text-zinc-500" />
                            <div>
                                <div className="text-sm font-bold text-white">Daily Performance Digest</div>
                                <div className="text-[10px] text-zinc-500">Summary of AI interactions and token usage.</div>
                            </div>
                        </div>
                        <select
                            value={emailDigest}
                            onChange={(e) => setEmailDigest(e.target.value)}
                            className="bg-zinc-800 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 ring-emerald-500/50"
                        >
                            <option value="none">No Digest</option>
                            <option value="daily">Every Morning</option>
                            <option value="weekly">Weekly Report</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Mail size={16} className="text-zinc-500" />
                            <div>
                                <div className="text-sm font-bold text-white">Security Alerts</div>
                                <div className="text-[10px] text-zinc-500">Email notifications for unusual login attempts.</div>
                            </div>
                        </div>
                        <div className="text-[8px] font-black bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded-full uppercase tracking-widest">Always On</div>
                    </div>
                </div>
            </SettingSection>

            <SettingSection title="Administrative">
                <SettingItem
                    label="SMS Reporting"
                    description="Urgent administrative alerts sent directly to your phone."
                    toggle
                    active={marketingSms}
                    onToggle={() => setMarketingSms(!marketingSms)}
                    icon={Bell}
                />
            </SettingSection>
        </div>
    );
};
