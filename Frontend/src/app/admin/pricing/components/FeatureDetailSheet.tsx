import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Edit, Zap, CheckCircle2 } from "lucide-react";
import { FEATURE_CATEGORIES, CategoryKey } from "../data/categories";
import { getThemeColorClasses } from "@/lib/themeUtils";

interface FeatureDetailSheetProps {
    open: boolean;
    onClose: () => void;
    feature: any;
    onEdit: () => void;
}

export default function FeatureDetailSheet({ open, onClose, feature, onEdit }: FeatureDetailSheetProps) {
    if (!feature) return null;

    // Icon Handling
    const IconComponent = (LucideIcons as any)[feature.icon];
    const isEmoji = !IconComponent;

    // CATEGORIES Map (Ideally shared, but duplicated for standalone safety)
    const CATEGORIES: any = FEATURE_CATEGORIES;

    const catLabel = CATEGORIES[feature.categoryId]?.label || "📦 Other";

    // Dynamic Header Background
    // If feature.color is defined (e.g. "blue"), map it to a gradient class
    // Fallback to strict slate/gray for professional look if undefined
    // Dynamic Header Background
    // If feature.color is defined (e.g. "blue"), map it to a gradient class
    // Fallback to strict slate/gray for professional look if undefined

    // Parse color name from Tailwind class (e.g., "text-blue-500" -> "blue")
    // Or use the raw string if it's already a simple color name
    const rawColor = feature.color || "blue";
    const colorName = rawColor.includes("-") ? rawColor.split("-")[1] : rawColor;

    const headerGradient = getThemeColorClasses(colorName);

    return (
        <Sheet open={open} onOpenChange={onClose}>
            {/* Added sm:max-w-[800px] to strictly override the sm:max-w-sm default from shadcn */}
            <SheetContent className="w-[400px] sm:w-[600px] sm:max-w-[600px] overflow-y-auto p-0 gap-0 border-l border-border/50 shadow-2xl">
                {/* Header with Dynamic Gradient */}
                <div className={`p-8 bg-gradient-to-b ${headerGradient} border-b relative`}>
                    <div className="absolute top-4 right-12 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Badge variant="outline" className="bg-background/50 backdrop-blur">
                            {catLabel}
                        </Badge>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="flex items-start justify-between">
                            <div className={`p-4 rounded-2xl bg-background shadow-lg ring-1 ring-black/5 dark:ring-white/10 ${feature.color ? `text-${feature.color}-500` : ''}`}>
                                {isEmoji ? (
                                    <span className="text-4xl">{feature.icon}</span>
                                ) : (
                                    <IconComponent className="h-8 w-8" strokeWidth={1.5} />
                                )}
                            </div>
                            <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-background/80 backdrop-blur border-border/50">
                                {catLabel}
                            </Badge>
                        </div>

                        <div className="space-y-2">
                            <SheetTitle className="text-3xl font-bold tracking-tight text-foreground">
                                {feature.label}
                            </SheetTitle>
                            <p className="text-sm font-mono text-muted-foreground/80 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-[pulse_3s_infinite]" />
                                {feature.defaults.location || "/dashboard/..."}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Description Section */}
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                            About Feature
                        </h3>
                        <SheetDescription className="text-base leading-relaxed text-foreground/90 font-normal">
                            {feature.desc || "No description provided."}
                        </SheetDescription>
                    </div>

                    <Separator className="bg-border/60" />

                    {/* Cost Breakdown */}
                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                Cost Structure & Components
                            </h3>
                            <Badge variant="outline" className="font-mono text-[10px]">
                                {feature.defaults.includes?.length || 0} SUB-FEATURES
                            </Badge>
                        </div>

                        <div className="grid gap-4">
                            {feature.defaults.includes?.map((item: any, idx: number) => {
                                const ItemIcon = (LucideIcons as any)[item.icon] || CheckCircle2;
                                return (
                                    <div key={idx} className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:shadow-md hover:border-primary/20 transition-all duration-300">

                                        <div className="p-4 flex gap-4">
                                            <div className="mt-1 p-2 rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors h-fit">
                                                <ItemIcon className="h-5 w-5" />
                                            </div>

                                            <div className="flex-1 space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-base text-card-foreground">
                                                        {item.name}
                                                    </span>
                                                    <Badge variant="secondary" className="font-mono text-[10px] uppercase">
                                                        {item.unit}
                                                    </Badge>
                                                </div>

                                                {/* Details */}
                                                {(item.desc || item.costReason) && (
                                                    <div className="space-y-3 pt-1">
                                                        {item.desc && (
                                                            <div className="text-sm text-muted-foreground leading-snug">
                                                                {item.desc}
                                                            </div>
                                                        )}
                                                        {item.costReason && (
                                                            <div className="relative pl-3 text-xs italic text-muted-foreground/80 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[2px] before:bg-primary/20 before:rounded-full">
                                                                <span className="font-medium text-primary/60 not-italic mr-1">Internal:</span>
                                                                {item.costReason}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Pricing Bar */}
                                        <div className="px-4 py-2.5 bg-muted/30 border-t border-border/50 flex items-center justify-between text-xs sm:text-sm font-mono group-hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground font-medium">Base Cost:</span>
                                                <span className="font-bold text-foreground">{item.baseMultiplier}x</span>
                                            </div>
                                            <div className="h-4 w-px bg-border" />
                                            <div className="flex items-center gap-2">
                                                <span className="text-emerald-600/80 dark:text-emerald-400/80 font-medium">Sell Price:</span>
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{item.sellMultiplier}x</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t bg-muted/5 backdrop-blur-sm sticky bottom-0">
                    <Button onClick={() => { onClose(); onEdit(); }} size="lg" className="w-full gap-2 shadow-lg hover:shadow-primary/20 transition-all">
                        <Edit className="h-4 w-4" />
                        Edit Configuration
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
