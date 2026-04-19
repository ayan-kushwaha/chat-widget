import React, { useState } from 'react';
import { INTEGRATION_APPS } from '../apps_registry'; // Import from new registry
import { Search, ChevronDown, ChevronRight, Zap, PlayCircle, Settings, Box, Layers, Filter, Repeat, Database, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ onDragStart, sourceApp }: { onDragStart: (event: React.DragEvent, nodeType: string, label: string, iconName: string, metadata: any) => void, sourceApp: string | null }) => {
    const [activeTab, setActiveTab] = useState<'triggers' | 'actions'>('triggers');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['core', 'communication', 'ecommerce', 'crm', 'utilities']); // Auto-expand popular

    // Toggle category expansion
    const toggleCategory = (cat: string) => {
        setExpandedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
    };

    // --- TRIGGERS LOGIC ---
    // If sourceApp is selected, only show triggers for that app.
    // If no sourceApp (shouldn't happen ideally due to modal), show prompt.
    const activeSourceApp = INTEGRATION_APPS.find(app => app.id === sourceApp);
    const sourceTriggers = activeSourceApp ? activeSourceApp.triggers : [];

    // --- ACTIONS LOGIC ---
    // Actions are grouped by Category -> App -> Actions
    // We want to show a list of Apps, expandable to show their actions.
    const filteredApps = INTEGRATION_APPS.filter(app =>
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const categories = Array.from(new Set(filteredApps.map(app => app.category)));

    return (
        <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full">
            {/* Header / Tabs */}
            <div className="p-4 border-b border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-white flex items-center gap-2">
                        <Box size={20} className="text-blue-500" />
                        Flow Elements
                    </h2>
                </div>

                <div className="flex bg-slate-800 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('triggers')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-2 transition-all ${activeTab === 'triggers' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <Zap size={14} /> Triggers
                    </button>
                    <button
                        onClick={() => setActiveTab('actions')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-2 transition-all ${activeTab === 'actions' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <PlayCircle size={14} /> Actions
                    </button>
                </div>

                {/* Search Bar (Only for Actions tab mostly, but works for both) */}
                <div className="mt-3 relative">
                    <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                    <input
                        type="text"
                        placeholder={activeTab === 'triggers' ? "Search triggers..." : "Search apps & actions..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800 text-slate-200 rounded-md pl-9 pr-3 py-2 text-xs border border-slate-700 focus:outline-none focus:border-blue-500 px-2"
                    />
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

                {activeTab === 'triggers' && (
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Source: {activeSourceApp?.name || 'None Selected'}
                        </h3>

                        {activeSourceApp ? (
                            <div className="grid gap-2">
                                {sourceTriggers
                                    .filter(t => t.label.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map((trigger) => (
                                        <DraggableItem
                                            key={trigger.id}
                                            type="trigger"
                                            label={trigger.label}
                                            icon={activeSourceApp.icon}
                                            color={activeSourceApp.color}
                                            iconName={activeSourceApp.id} // Used for rendering later
                                            onDragStart={onDragStart} // Pass handler
                                            metadata={{
                                                triggerId: trigger.id,
                                                appId: activeSourceApp.id,
                                                description: trigger.description,
                                                outputs: trigger.outputs // Pass outputs for mapping
                                            }}
                                            description={trigger.description}
                                        />
                                    ))}
                                {sourceTriggers.length === 0 && (
                                    <p className="text-xs text-slate-500 italic">No triggers found.</p>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 px-4 bg-slate-800/50 rounded-lg border border-dashed border-slate-700">
                                <Filter className="mx-auto text-slate-500 mb-2" size={24} />
                                <p className="text-sm text-slate-400">Please select a Source App to see triggers.</p>
                            </div>
                        )}

                        {/* Logic Section (Always available) */}
                        <div className="pt-4 border-t border-slate-800">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Logic & Helpers</h3>
                            <div className="grid gap-2">
                                <DraggableItem onDragStart={onDragStart} type="logic" label="Wait / Delay" icon={Settings} color="#FBBF24" iconName="Clock" metadata={{ actionId: 'wait_delay', icon: 'Clock', label: 'Wait / Delay' }} />
                                <DraggableItem onDragStart={onDragStart} type="logic" label="If / Else Branch" icon={Layers} color="#FACC15" iconName="Brain" metadata={{ actionId: 'condition', icon: 'Brain', label: 'If / Else' }} />
                                <DraggableItem onDragStart={onDragStart} type="logic" label="Repeat / Loop" icon={Repeat} color="#38BDF8" iconName="Repeat" metadata={{ actionId: 'loop', icon: 'Repeat', label: 'Loop List' }} />
                                <DraggableItem onDragStart={onDragStart} type="set_var" label="Set Variable" icon={Database} color="#14B8A6" iconName="Database" metadata={{ actionId: 'set_var', label: 'Set Variable' }} />
                                <DraggableItem onDragStart={onDragStart} type="logic" label="Execute Code" icon={Code} color="#F43F5E" iconName="Zap" metadata={{ actionId: 'code', icon: 'Zap', label: 'JS Code' }} />
                            </div>
                        </div>

                    </div>
                )}

                {activeTab === 'actions' && (
                    <div className="space-y-6">
                        {categories.map((cat) => (
                            <div key={cat} className="space-y-2">
                                <div
                                    className="flex items-center justify-between cursor-pointer group"
                                    onClick={() => toggleCategory(cat)}
                                >
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-300 transition-colors">
                                        {cat}
                                    </h3>
                                    {expandedCategories.includes(cat) ? <ChevronDown size={14} className="text-slate-600" /> : <ChevronRight size={14} className="text-slate-600" />}
                                </div>

                                <AnimatePresence>
                                    {expandedCategories.includes(cat) && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="space-y-4 overflow-hidden"
                                        >
                                            {filteredApps.filter(app => app.category === cat).map(app => (
                                                <div key={app.id} className="bg-slate-800/30 rounded-lg p-3 border border-slate-800/50">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <app.icon size={14} style={{ color: app.color }} />
                                                        <span className="text-sm font-semibold text-slate-300">{app.name}</span>
                                                    </div>
                                                    <div className="grid gap-2 pl-2 border-l-2 border-slate-800 ml-1.5">
                                                        {app.actions.map(action => (
                                                            <DraggableItem
                                                                key={action.id}
                                                                type="action" // Node type
                                                                label={action.label}
                                                                icon={app.icon}
                                                                color={app.color} // Dynamic color
                                                                iconName={app.id}
                                                                onDragStart={onDragStart} // Pass handler
                                                                metadata={{
                                                                    actionId: action.id,
                                                                    appId: app.id,
                                                                    inputs: action.inputs,
                                                                    description: action.description
                                                                }}
                                                                description={action.description}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900">
                <p className="text-[10px] text-slate-500 text-center">
                    Drag items onto the canvas to build your flow.
                </p>
            </div>
        </aside>
    );
};

// --- Helper Component for Draggable Items ---
interface DraggableItemProps {
    type: string;
    label: string;
    icon: any;
    color: string;
    iconName: string;
    metadata?: any;
    description?: string;
    onDragStart: (event: React.DragEvent, nodeType: string, label: string, iconName: string, metadata: any) => void;
}

const DraggableItem = ({ type, label, icon: Icon, color, iconName, metadata = {}, description, onDragStart }: DraggableItemProps) => (
    <div
        onDragStart={(e) => onDragStart(e, type, label, iconName, metadata)} draggable
        className="flex flex-col gap-1 p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-grab hover:border-slate-600 hover:bg-slate-800 transition-all group relative"
    >
        <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md bg-slate-800 group-hover:scale-110 transition-transform">
                <div className="text-white">
                    {/* Render Icon safely whether it's a component or string hex if customized, but here it's component or string */}
                    {typeof Icon === 'string' ? <div className={`w-3.5 h-3.5 rounded-full`} style={{ backgroundColor: color }}></div> : <Icon size={14} style={{ color: color.startsWith('#') ? color : undefined }} className={!color.startsWith('#') ? color : ''} />}
                </div>
            </div>
            <span className="text-xs font-medium text-slate-300 group-hover:text-white line-clamp-1">{label}</span>
        </div>
        {description && (
            <p className="text-[10px] text-slate-500 pl-11 line-clamp-1 group-hover:text-slate-400 group-hover:line-clamp-none transition-all">
                {description}
            </p>
        )}
    </div>
);

export default Sidebar;
