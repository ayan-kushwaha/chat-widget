"use client";

import { usePathname } from "next/navigation";
import { MultiViewWidget } from "@/components/chatbot/widgets/MultiViewWidget";
import { useOrg } from "@/context/OrgContext";

export const GlobalWidgetWrapper = () => {
    const pathname = usePathname();
    const isEmbed = pathname?.startsWith("/embed");
    const { activeOrgId } = useOrg();

    // if (isEmbed) return null;

    // return <MultiViewWidget orgId={activeOrgId} />;
    return null; // Disabled to prevent double bubble (User added script manually)
};

