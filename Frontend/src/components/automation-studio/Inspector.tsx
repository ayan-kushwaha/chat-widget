import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Settings, Trash2, Save } from "lucide-react";
import { Node } from "reactflow";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface InspectorProps {
    selectedNode: Node | null;
    onClose: () => void;
    onDelete: () => void;
    onSave: (nodeId: string, config: any) => void;
}

export default function Inspector({ selectedNode, onClose, onDelete, onSave }: InspectorProps) {
    const [selectedEvent, setSelectedEvent] = useState("");
    const [conditionType, setConditionType] = useState("contains");
    const [conditionValue, setConditionValue] = useState("");
    const [aiTask, setAiTask] = useState("sentiment");
    const [aiInstruction, setAiInstruction] = useState("");
    const [selectedAction, setSelectedAction] = useState("");
    const [messageContent, setMessageContent] = useState("");

    useEffect(() => {
        if (selectedNode) {
            const originalData = selectedNode.data.originalData;

            if (originalData.events) {
                setSelectedEvent(originalData.events[0]);
            }
            if (originalData.actions) {
                setSelectedAction(originalData.actions[0]);
            }
            setConditionValue("");
            setAiInstruction("");
            setMessageContent("");
        }
    }, [selectedNode?.id]);

    const handleSave = () => {
        if (!selectedNode) return;

        const config = {
            nodeId: selectedNode.id,
            nodeName: selectedNode.data.originalData.name,
            nodeType: selectedNode.data.nodeType,
            event: selectedEvent,
            condition: conditionType,
            conditionValue,
            aiTask,
            aiInstruction,
            action: selectedAction,
            message: messageContent,
        };

        onSave(selectedNode.id, config);
        onClose(); // Auto-close after save
    };

    if (!selectedNode) return null;

    const nodeType = selectedNode.data.nodeType;
    const originalData = selectedNode.data.originalData;

    return (
        <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="w-96 border-l border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
        >
            <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-800">
                    <div>
                        <h3 className="font-semibold text-neutral-900 dark:text-white">Node Inspector</h3>
                        <p className="text-xs text-neutral-500 capitalize">{nodeType}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-4">
                        {/* Trigger Settings */}
                        {nodeType === "trigger" && originalData.events && (
                            <div>
                                <Label>Trigger Event</Label>
                                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select event" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {originalData.events.map((event: string) => (
                                            <SelectItem key={event} value={event}>{event}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Logic Settings */}
                        {nodeType === "logic" && (
                            <>
                                {originalData.id === "if-else" && originalData.conditions && (
                                    <>
                                        <div>
                                            <Label>Condition Type</Label>
                                            <Select value={conditionType} onValueChange={setConditionType}>
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Select condition" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {originalData.conditions.map((condition: string) => (
                                                        <SelectItem key={condition} value={condition.toLowerCase().replace(/ /g, "_")}>
                                                            {condition}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Value to Check</Label>
                                            <Input
                                                className="mt-1"
                                                placeholder='e.g., "Casino" or "spam.com"'
                                                value={conditionValue}
                                                onChange={(e) => setConditionValue(e.target.value)}
                                            />
                                        </div>
                                    </>
                                )}
                                {originalData.id === "ai-brain" && originalData.capabilities && (
                                    <>
                                        <div>
                                            <Label>AI Task</Label>
                                            <Select value={aiTask} onValueChange={setAiTask}>
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Select AI task" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {originalData.capabilities.map((capability: string) => (
                                                        <SelectItem key={capability} value={capability.toLowerCase().replace(/ /g, "_")}>
                                                            {capability}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>AI Instruction</Label>
                                            <Textarea
                                                className="mt-1"
                                                placeholder="Tell AI what to do..."
                                                rows={4}
                                                value={aiInstruction}
                                                onChange={(e) => setAiInstruction(e.target.value)}
                                            />
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        {/* Action Settings */}
                        {nodeType === "action" && originalData.actions && (
                            <>
                                <div>
                                    <Label>Action</Label>
                                    <Select value={selectedAction} onValueChange={setSelectedAction}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select action" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {originalData.actions.map((action: string) => (
                                                <SelectItem key={action} value={action}>{action}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Message / Content</Label>
                                    <Textarea
                                        className="mt-1"
                                        placeholder="Enter message or content..."
                                        rows={4}
                                        value={messageContent}
                                        onChange={(e) => setMessageContent(e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                            <Button
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                size="sm"
                                onClick={handleSave}
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Save & Close
                            </Button>

                            <Button variant="outline" className="w-full" size="sm">
                                <Settings className="mr-2 h-3 w-3" />
                                Advanced Settings
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                                size="sm"
                                onClick={onDelete}
                            >
                                <Trash2 className="mr-2 h-3 w-3" />
                                Delete Node
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
