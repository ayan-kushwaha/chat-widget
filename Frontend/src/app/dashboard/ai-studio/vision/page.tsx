"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus, Image as ImageIcon, Download, Heart, Eye, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const images = [
    {
        id: "1",
        url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400",
        prompt: "Futuristic AI robot helping customers",
        model: "DALL-E 3",
        size: "1024x1024",
        likes: 45,
        views: 234,
    },
    {
        id: "2",
        url: "https://images.unsplash.com/photo-1676277791608-ac54525aa94d?w=400",
        prompt: "Modern chatbot interface with holographic display",
        model: "Midjourney",
        size: "1024x1024",
        likes: 89,
        views: 456,
    },
    {
        id: "3",
        url: "https://images.unsplash.com/photo-1677756119517-756a188d2d94?w=400",
        prompt: "AI assistant analyzing data on multiple screens",
        model: "Stable Diffusion",
        size: "1024x1024",
        likes: 67,
        views: 312,
    },
    {
        id: "4",
        url: "https://images.unsplash.com/photo-1676299081847-824916de030a?w=400",
        prompt: "Customer service bot in a sleek office environment",
        model: "DALL-E 3",
        size: "1024x1024",
        likes: 123,
        views: 589,
    },
];

export default function VisionGalleryPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                        Vision Gallery 🎨
                    </h2>
                    <p className="text-neutral-500 dark:text-neutral-400">
                        AI-generated images for your brand and marketing.
                    </p>
                </div>
                <Button className="bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Generate Image
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                {[
                    { label: "Total Images", value: "156", icon: ImageIcon },
                    { label: "This Month", value: "24", icon: Sparkles },
                    { label: "Total Likes", value: "1.2K", icon: Heart },     { label: "Total Views", value: "8.5K", icon: Eye },
                ].map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                                {stat.label}
                                            </p>
                                            <h3 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
                                                {stat.value}
                                            </h3>
                                        </div>
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 text-white">
                                            <Icon className="h-6 w-6" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Gallery Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {images.map((image, index) => (
                    <motion.div
                        key={image.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="group overflow-hidden">
                            <div className="relative aspect-square overflow-hidden">
                                <img
                                    src={image.url}
                                    alt={image.prompt}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                                    <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                                        <Button size="sm" className="flex-1 bg-white/90 text-neutral-900 hover:bg-white">
                                            <Download className="mr-2 h-3 w-3" />
                                            Download
                                        </Button>
                                        <Button size="sm" variant="outline" className="border-white/50 bg-white/10 text-white hover:bg-white/20">
                                            <Heart className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardDescription className="line-clamp-2 text-xs">
                                            {image.prompt}
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline" className="ml-2">
                                        {image.model}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-xs text-neutral-500">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1">
                                            <Heart className="h-3 w-3" />
                                            {image.likes}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Eye className="h-3 w-3" />
                                            {image.views}
                                        </div>
                                    </div>
                                    <span>{image.size}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
