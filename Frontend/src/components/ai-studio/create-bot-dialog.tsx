"use client";

import React from "react";
import { Plus, Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function CreateBotDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Bot
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create AI Agent</DialogTitle>
                    <DialogDescription>
                        Configure your new AI agent. You can change these settings later.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" placeholder="e.g. Customer Support Bot" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" placeholder="What does this bot do?" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="model">Model</Label>
                        <Select defaultValue="gpt-4o">
                            <SelectTrigger>
                                <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                                <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                                <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Create Agent
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
