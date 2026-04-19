import React, { useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Building2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { uploadOrgAsset } from "@/api/org.api";
import { ImageCropModal } from "../ImageCropModal";
import { cn } from "@/lib/utils";

interface ProfileImageHeroProps {
    org: any;
    isEditing: boolean;
    gradient: string;
    onOrgChange: (field: string, value: any) => void;
    cropModal: { open: boolean, src: string, type: 'logo' | 'banner' };
    setCropModal: React.Dispatch<React.SetStateAction<{ open: boolean, src: string, type: 'logo' | 'banner' }>>;
}

export function ProfileImageHero({
    org,
    isEditing,
    gradient,
    onOrgChange,
    cropModal,
    setCropModal
}: ProfileImageHeroProps) {
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    return (
        <>
            {/* Image Crop Modal */}
            <ImageCropModal
                open={cropModal.open}
                onClose={() => setCropModal(prev => ({ ...prev, open: false }))}
                imageSrc={cropModal.src}
                cropShape={cropModal.type === "logo" ? "round" : "rect"}
                aspect={cropModal.type === "logo" ? 1 : 4}
                title={cropModal.type === "logo" ? "Crop Logo" : "Crop Cover Banner"}
                onCropComplete={async (dataUrl: string) => {
                    const assetType = cropModal.type === "logo" ? "logo" : "banner";
                    const tid = toast.loading(`Uploading ${assetType}...`);
                    try {
                        const permanentUrl = await uploadOrgAsset(dataUrl, assetType);
                        if (onOrgChange) {
                            onOrgChange(cropModal.type === "logo" ? "logo" : "bannerImage", permanentUrl);
                        }
                        toast.success(`${assetType === 'logo' ? 'Logo' : 'Banner'} uploaded! ✅`, { id: tid });
                    } catch (err) {
                        console.error("Asset upload error:", err);
                        toast.error("Upload failed — please try again", { id: tid });
                    }
                }}
            />
            {/* ── Cover Banner ── */}
            <div
                className={cn("relative w-full bg-gradient-to-r transition-all duration-300", gradient)}
                style={{
                    aspectRatio: "4",
                    ...(org.bannerImage ? { backgroundImage: `url(${org.bannerImage})`, backgroundSize: "cover", backgroundPosition: "center" } : {})
                }}
            >
                <div className="absolute inset-0 opacity-20 transition-opacity duration-500"
                    style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 0%, transparent 60%), radial-gradient(circle at 80% 20%, white 0%, transparent 50%)" }}
                />
                {!isEditing && (
                    <div className="absolute bottom-3 right-4 text-white/30 text-4xl font-black select-none max-w-[60%] tracking-tighter mix-blend-overlay">
                        {org.name || "Your Business"}
                    </div>
                )}
                {isEditing && (
                    <>
                        <div
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer group"
                            onClick={() => bannerInputRef.current?.click()}
                        >
                            <div className="flex items-center gap-2 text-white bg-black/50 px-4 py-2 rounded-full backdrop-blur-md border border-white/20 group-hover:scale-105 transition-transform">
                                <Camera className="w-4 h-4" />
                                <span className="text-sm font-medium">Change Cover</span>
                            </div>
                        </div>
                        <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            e.target.value = "";
                            const url = URL.createObjectURL(file);
                            setCropModal({ open: true, src: url, type: "banner" });
                        }} />
                    </>
                )}
            </div>

            {/* ── Logo & User Info Header ── */}
            <div className="px-6 sm:px-8 relative flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4">
                {/* Org Logo overlapping banner */}
                <div className="relative -mt-12 sm:-mt-16 z-10 group">
                    <Avatar className={cn(
                        "h-24 w-24 sm:h-32 sm:w-32 border-4 border-white dark:border-[#09090b] shadow-xl transition-transform",
                        isEditing && "cursor-pointer group-hover:scale-105"
                    )} onClick={() => isEditing && logoInputRef.current?.click()}>
                        <AvatarImage src={org.logo} className="object-cover bg-white dark:bg-neutral-900" />
                        <AvatarFallback className={`bg-gradient-to-br ${gradient} text-white font-bold text-3xl sm:text-4xl shadow-inner`}>
                            {org.name?.charAt(0)?.toUpperCase() || <Building2 className="h-10 w-10 sm:h-12 sm:w-12 opacity-80" />}
                        </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                        <>
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer pointer-events-none border-4 border-transparent backdrop-blur-sm">
                                <Pencil className="h-6 w-6 sm:h-8 sm:w-8 text-white drop-shadow-md" />
                            </div>
                            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                e.target.value = "";
                                const url = URL.createObjectURL(file);
                                setCropModal({ open: true, src: url, type: "logo" });
                            }} />
                        </>
                    )}
                </div>

                {/* Org Name beside logo */}
                <div className="flex-1 flex flex-col justify-end pb-2 mt-2 sm:mt-0 min-w-0">
                    {isEditing ? (
                        <input
                            value={org.name || ""}
                            onChange={e => onOrgChange?.("name", e.target.value)}
                            placeholder="Organization Name"
                            className="bg-transparent text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 border-0 border-b-2 border-blue-400 focus:outline-none focus:border-blue-500 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 pb-1 min-w-0 w-full max-w-sm transition-colors"
                        />
                    ) : (
                        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                            {org.name || "Your Business"}
                        </h2>
                    )}
                    {org.tagline && !isEditing && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{org.tagline}</p>
                    )}
                </div>
            </div>
        </>
    );
}
