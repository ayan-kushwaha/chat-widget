"use client";

import React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useOrg } from "@/context/OrgContext";

export default function OrgSwitcher({ className }: { className?: string }) {
    const { organizations, activeOrgId, switchOrg } = useOrg();
    const activeOrg = organizations.find((org) => org.id === activeOrgId);

    // If only 1 organization (or 0), show static header (no dropdown)
    if (organizations.length <= 1) {
        return (
            <div className={cn("flex w-full items-center gap-2 px-2", className)}>
                <Avatar className="h-5 w-5">
                    <AvatarImage
                        src={`https://avatar.vercel.sh/${activeOrg?.id}.png`}
                        alt={activeOrg?.name}
                    />
                    <AvatarFallback>{activeOrg?.name?.charAt(0) || "O"}</AvatarFallback>
                </Avatar>
                <span className="truncate font-medium text-sm">{activeOrg?.name || "My Organization"}</span>
            </div>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-label="Select a team"
                    className={cn("w-full justify-between cursor-pointer hover:bg-accent hover:text-accent-foreground", className)}
                >
                    <div className="flex items-center gap-2 truncate">
                        <Avatar className="h-5 w-5">
                            <AvatarImage
                                src={`https://avatar.vercel.sh/${activeOrg?.id}.png`}
                                alt={activeOrg?.name}
                            />
                            <AvatarFallback>{activeOrg?.name?.charAt(0) || "O"}</AvatarFallback>
                        </Avatar>
                        <span className="truncate">{activeOrg?.name || "Select Organization"}</span>
                    </div>
                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]">
                <DropdownMenuLabel>Organizations</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {organizations.map((org) => (
                    <DropdownMenuItem
                        key={org.id}
                        onSelect={() => switchOrg(org.id)}
                        className="cursor-pointer"
                    >
                        <Avatar className="mr-2 h-5 w-5">
                            <AvatarImage
                                src={`https://avatar.vercel.sh/${org.id}.png`}
                                alt={org.name}
                            />
                            <AvatarFallback>{org.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="truncate flex-1">{org.name}</span>
                        {activeOrgId === org.id && (
                            <Check className="ml-auto h-4 w-4 opacity-100" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
