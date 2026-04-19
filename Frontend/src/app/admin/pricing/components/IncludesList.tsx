import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface IncludesListProps {
    includes: any[];
    onChange: (includes: any[]) => void;
}

export default function IncludesList({ includes, onChange }: IncludesListProps) {

    const addInclude = () => {
        onChange([...includes, {
            name: "",
            unit: "TOKENS",
            baseMultiplier: 0,
            sellMultiplier: 0,
            desc: "",
            costReason: ""
        }]);
    };

    const removeInclude = (index: number) => {
        onChange(includes.filter((_, i) => i !== index));
    };

    const updateInclude = (index: number, field: string, value: any) => {
        onChange(includes.map((item, i) => i === index ? { ...item, [field]: value } : item));
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold text-muted-foreground">Sub-Features (Cost Components)</Label>
                <Button type="button" size="sm" variant="outline" onClick={addInclude} className="gap-2 h-7 text-xs">
                    <Plus className="h-3 w-3" /> Add Item
                </Button>
            </div>

            <div className="space-y-3 pb-2">
                {includes.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-6 bg-muted/20 rounded-lg border border-dashed flex flex-col items-center gap-2">
                        <span className="bg-muted p-2 rounded-full"><Plus className="h-4 w-4 opacity-50" /></span>
                        <p>No sub-features added.</p>
                        <p className="text-xs opacity-70">Add components to define pricing.</p>
                    </div>
                )}
                {includes.map((item, index) => (
                    <Card key={index} className="p-3 relative border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2 h-6 w-6 text-zinc-400 hover:text-red-500 z-10"
                            onClick={() => removeInclude(index)}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>

                        <div className="grid grid-cols-2 gap-3 pr-6">
                            <div className="col-span-1 space-y-1">
                                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Item Name</Label>
                                <Input
                                    className="h-8 text-sm"
                                    placeholder="e.g. Website Crawling"
                                    value={item.name || ""}
                                    onChange={(e) => updateInclude(index, "name", e.target.value)}
                                />
                            </div>
                            <div className="col-span-1 space-y-1">
                                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Unit</Label>
                                <Input
                                    className="h-8 text-sm font-mono bg-muted/50 text-muted-foreground"
                                    value="TOKENS"
                                    disabled
                                />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Description (User Facing)</Label>
                                <Textarea
                                    placeholder="Explanation..."
                                    rows={2}
                                    value={item.desc || ""}
                                    onChange={(e) => updateInclude(index, "desc", e.target.value)}
                                />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Cost Reason (Internal)</Label>
                                <Textarea
                                    placeholder="Justification (e.g. API fees)..."
                                    rows={2}
                                    value={item.costReason || ""}
                                    onChange={(e) => updateInclude(index, "costReason", e.target.value)}
                                />
                            </div>
                            <div className="col-span-1 space-y-1">
                                <Label className="text-[10px] text-red-500 font-bold uppercase">Base Cost (x)</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    className="h-8 text-sm"
                                    value={item.baseMultiplier}
                                    onChange={(e) => updateInclude(index, "baseMultiplier", e.target.value)}
                                />
                            </div>
                            <div className="col-span-1 space-y-1">
                                <Label className="text-[10px] text-green-600 font-bold uppercase">Sell Price (x)</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    className="h-8 text-sm font-bold text-green-700 dark:text-green-500"
                                    value={item.sellMultiplier}
                                    onChange={(e) => updateInclude(index, "sellMultiplier", e.target.value)}
                                />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
