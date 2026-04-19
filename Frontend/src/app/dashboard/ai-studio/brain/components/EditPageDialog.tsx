import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/api";

interface EditPageDialogProps {
    isOpen: boolean;
    onClose: () => void;
    siteId: string;
    page: any;
    onUpdate: () => void;
}

export function EditPageDialog({ isOpen, onClose, siteId, page, onUpdate }: EditPageDialogProps) {
    const [loading, setLoading] = useState(false);
    const [frequency, setFrequency] = useState(page?.crawl_frequency || "14d");
    const [tags, setTags] = useState(page?.ai_tags?.join(", ") || "");

    const handleSave = async () => {
        setLoading(true);
        try {
            const formattedTags = tags.split(",").map((t: string) => t.trim()).filter((t: string) => t);
            await api.put(`/sites/${siteId}/pages/${page._id}`, {
                crawl_frequency: frequency,
                ai_tags: formattedTags
            });
            toast.success("Page updated successfully");
            onUpdate();
            onClose();
        } catch (error) {
            toast.error("Failed to update page");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Page Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Page URL</Label>
                        <Input value={page?.url} disabled className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                        <Label>Crawl Frequency</Label>
                        <Select value={frequency} onValueChange={setFrequency}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="3d">Every 3 Days</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="14d">Bi-weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>AI Tags (comma separated)</Label>
                        <Input
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="intro, pricing, features"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
