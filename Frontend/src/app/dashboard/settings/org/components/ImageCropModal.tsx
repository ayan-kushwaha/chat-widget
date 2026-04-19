"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, RotateCcw, Check } from "lucide-react";

interface Area {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface ImageCropModalProps {
    open: boolean;
    onClose: () => void;
    imageSrc: string;
    /** 'round' for logo, 'rect' for banner */
    cropShape?: "round" | "rect";
    /** aspect ratio: 1 for logo, 16/3 for banner */
    aspect?: number;
    title?: string;
    onCropComplete: (croppedDataUrl: string) => void;
}

/**
 * Creates a cropped image blob from original src + pixel crop area.
 */
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
    const image = await createImageBitmap(await (await fetch(imageSrc)).blob());
    const canvas = document.createElement("canvas");
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(
        // @ts-ignore — createImageBitmap returns ImageBitmap which is valid source
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );
    return canvas.toDataURL("image/webp", 0.92);
}

export function ImageCropModal({
    open,
    onClose,
    imageSrc,
    cropShape = "rect",
    aspect = 16 / 3,
    title = "Crop Image",
    onCropComplete,
}: ImageCropModalProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [loading, setLoading] = useState(false);

    const onCropChange = useCallback((newCrop: { x: number; y: number }) => {
        setCrop(newCrop);
    }, []);

    const onZoomChange = useCallback((newZoom: number) => {
        setZoom(newZoom);
    }, []);

    const onCropAreaChange = useCallback((_: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleApply = async () => {
        if (!croppedAreaPixels) return;
        setLoading(true);
        try {
            const croppedDataUrl = await getCroppedImg(imageSrc, croppedAreaPixels);
            onCropComplete(croppedDataUrl);
            onClose();
        } catch (err) {
            console.error("Crop failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-xl w-full p-0 overflow-hidden rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-950 shadow-2xl">
                <DialogHeader className="px-6 pt-5 pb-3 border-b border-neutral-100 dark:border-white/5">
                    <DialogTitle className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {title}
                    </DialogTitle>
                </DialogHeader>

                {/* Crop Area */}
                <div
                    className="relative bg-neutral-900"
                    style={{ height: cropShape === "round" ? 320 : 220 }}
                >
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        cropShape={cropShape}
                        showGrid={true}
                        onCropChange={onCropChange}
                        onZoomChange={onZoomChange}
                        onCropComplete={onCropAreaChange}
                        style={{
                            containerStyle: { borderRadius: 0 },
                            cropAreaStyle: {
                                border: "2px solid rgba(255,255,255,0.6)",
                                boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                            },
                        }}
                    />
                </div>

                {/* Zoom Controls */}
                <div className="px-6 py-3 flex items-center gap-3 border-t border-neutral-100 dark:border-white/5">
                    <button
                        type="button"
                        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-500 transition-colors"
                        onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>

                    <div className="flex-1">
                        <Slider
                            min={1}
                            max={3}
                            step={0.05}
                            value={[zoom]}
                            onValueChange={([v]) => setZoom(v)}
                            className="w-full"
                        />
                    </div>

                    <button
                        type="button"
                        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-500 transition-colors"
                        onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-500 transition-colors ml-2"
                        onClick={handleReset}
                        title="Reset"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>

                <DialogFooter className="px-6 pt-4 pb-5 flex justify-end gap-2 border-t border-neutral-100 dark:border-white/5">
                    <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button size="sm" onClick={handleApply} disabled={loading} className="gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        {loading ? "Applying..." : "Apply Crop"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
