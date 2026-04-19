"use client";

import React, { useState } from 'react';
import { SettingSection, SettingItem, ThemeCard } from './SharedComponents';

export const GeneralSettings: React.FC = () => {
    // Local Mock State for General Settings
    const [launchStartup, setLaunchStartup] = useState(false);
    const [runBackground, setRunBackground] = useState(true);
    const [language, setLanguage] = useState('English (US)');
    const [timezone, setTimezone] = useState('UTC +5:30 (Mumbai)');
    const [uiScaling, setUiScaling] = useState(100);

    return (
        <div className="space-y-8">
            <SettingSection title="Login & Startup">
                <SettingItem
                    label="Launch on startup"
                    description="Automatically open Cluaiz when you log in to Windows."
                    toggle
                    active={launchStartup}
                    onToggle={() => setLaunchStartup(!launchStartup)}
                />
                <SettingItem
                    label="Run in background"
                    description="Keep Cluaiz running in the tray when window is closed."
                    toggle
                    active={runBackground}
                    onToggle={() => setRunBackground(!runBackground)}
                />
            </SettingSection>

            <SettingSection title="Localization">
                <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-bold text-white">System Language</div>
                            <div className="text-[10px] text-zinc-500">Default language for dashboard and widget UI.</div>
                        </div>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-zinc-800 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 ring-emerald-500/50"
                        >
                            <option>English (US)</option>
                            <option>Hindi (भारत)</option>
                            <option>Spanish</option>
                            <option>French</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-bold text-white">Timezone</div>
                            <div className="text-[10px] text-zinc-500">Used for analytics and scheduling data.</div>
                        </div>
                        <select
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="bg-zinc-800 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 ring-emerald-500/50"
                        >
                            <option>UTC +5:30 (Mumbai)</option>
                            <option>UTC +0:00 (London)</option>
                            <option>UTC -5:00 (New York)</option>
                            <option>UTC +8:00 (Singapore)</option>
                        </select>
                    </div>
                </div>
            </SettingSection>

            <SettingSection title="Appearance & Scaling">
                <div className="p-4 space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-bold text-white">Interface Scaling</div>
                            <div className="text-xs font-mono text-emerald-500">{uiScaling}%</div>
                        </div>
                        <input
                            type="range"
                            min="80"
                            max="120"
                            step="5"
                            value={uiScaling}
                            onChange={(e) => setUiScaling(Number(e.target.value))}
                            className="w-full accent-emerald-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div className="flex gap-4 pt-2">
                        <ThemeCard label="System Default" active />
                        <ThemeCard label="Dark Mode" />
                        <ThemeCard label="Light Mode" />
                    </div>
                </div>
            </SettingSection>
        </div>
    );
};
