import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Locate, Loader2, MapPin } from "lucide-react";
import { SearchableSelect } from "../SearchableSelect";
import { CollapsibleSection } from "../shared/CollapsibleSection";

interface ProfileAddressEditProps {
    businessAddress: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        pincode?: string;
    } | undefined;
    countries: { value: string; label: string }[];
    states: { value: string; label: string }[];
    cities: { value: string; label: string }[];
    fetchingLocation: boolean;
    isOpen: boolean;
    onToggle: (id: string) => void;
    handleCountryChange: (val: string) => void;
    handleStateChange: (val: string) => void;
    handleAddressChange: (field: "street" | "city" | "state" | "country" | "pincode", value: string) => void;
    handleAutoFill: () => void;
}

export function ProfileAddressEdit({
    businessAddress,
    countries,
    states,
    cities,
    fetchingLocation,
    isOpen,
    onToggle,
    handleCountryChange,
    handleStateChange,
    handleAddressChange,
    handleAutoFill
}: ProfileAddressEditProps) {
    return (
        <CollapsibleSection
            id="address"
            title="Physical Address"
            icon={MapPin}
            isOpen={isOpen}
            onToggle={onToggle}
        >
            <div className="grid sm:grid-cols-2 gap-4 pb-4">
                <div className="space-y-2">
                    <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Country</Label>
                    <SearchableSelect
                        options={countries}
                        value={businessAddress?.country || ""}
                        onChange={handleCountryChange}
                        placeholder="Select Country"
                        searchPlaceholder="Search country..."
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">State / Province</Label>
                    <SearchableSelect
                        options={states}
                        value={businessAddress?.state || ""}
                        onChange={handleStateChange}
                        placeholder={states.length > 0 ? "Select State" : "Enter State"}
                        searchPlaceholder="Search state..."
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">City</Label>
                    {cities.length > 0 ? (
                        <SearchableSelect
                            options={cities}
                            value={businessAddress?.city || ""}
                            onChange={(val) => handleAddressChange("city", val)}
                            placeholder="Enter city..."
                            searchPlaceholder="Search city..."
                        />
                    ) : (
                        <Input
                            value={businessAddress?.city || ""}
                            onChange={e => handleAddressChange("city", e.target.value)}
                            placeholder="Type your city..."
                        />
                    )}
                </div>
                <div className="space-y-2 relative">
                    <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Postal Code</Label>
                    <div className="relative">
                        <Input
                            value={businessAddress?.pincode || ""}
                            onChange={e => handleAddressChange("pincode", e.target.value)}
                            placeholder="110001"
                        />
                        <button
                            type="button"
                            onClick={handleAutoFill}
                            disabled={fetchingLocation}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-neutral-400 hover:text-blue-500 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors z-10"
                            title="Detect Location"
                        >
                            {fetchingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Locate className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
                <div className="sm:col-span-2 space-y-2">
                    <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Street Address</Label>
                    <Input
                        value={businessAddress?.street || ""}
                        onChange={e => handleAddressChange("street", e.target.value)}
                        placeholder="Flat No, Building, Street Name"
                    />
                </div>
            </div>
        </CollapsibleSection>
    );
}
