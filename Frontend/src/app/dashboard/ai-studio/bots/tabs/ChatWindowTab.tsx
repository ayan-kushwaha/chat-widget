"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Building2, MessageCircle, HelpCircle, FileText } from "lucide-react";

interface ChatWindowTabProps {
    config: any;
    orgId: string;
}

// Import page designers
// Import page designers
import { AboutPageDesigner } from "./page-designers/AboutPageDesigner";
import { FAQPageDesigner } from "./page-designers/FAQPageDesigner";
import { FormPageDesigner } from "./page-designers/FormPageDesigner";
import { HomePageDesigner } from "./page-designers/HomePageDesigner";

export function ChatWindowTab({ config, orgId }: ChatWindowTabProps) {
    return (
        <div className="h-full">
            {/* Full Screen Nested Tabs */}
            <Tabs defaultValue="home" className="h-full flex flex-col">
                <TabsList className="w-full grid grid-cols-4 bg-slate-800/50 p-1 rounded-t-xl">
                    <TabsTrigger value="home" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                        <Home className="w-4 h-4" />
                        <span className="hidden sm:inline">Home</span>
                    </TabsTrigger>
                    <TabsTrigger value="about" className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                        <Building2 className="w-4 h-4" />
                        <span className="hidden sm:inline">About Us</span>
                    </TabsTrigger>
                    <TabsTrigger value="faq" className="gap-2 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                        <HelpCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">FAQ</span>
                    </TabsTrigger>
                    <TabsTrigger value="form" className="gap-2 data-[state=active]:bg-pink-600 data-[state=active]:text-white">
                        <FileText className="w-4 h-4" />
                        <span className="hidden sm:inline">Form</span>
                    </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-hidden bg-slate-900/30 rounded-b-xl">
                    <TabsContent value="home" forceMount className="m-0 h-full data-[state=inactive]:hidden">
                        <HomePageDesigner config={config} orgId={orgId} />
                    </TabsContent>

                    <TabsContent value="about" forceMount className="m-0 h-full data-[state=inactive]:hidden">
                        <AboutPageDesigner config={config} orgId={orgId} />
                    </TabsContent>

                    <TabsContent value="faq" forceMount className="m-0 h-full data-[state=inactive]:hidden">
                        <FAQPageDesigner config={config} orgId={orgId} />
                    </TabsContent>

                    <TabsContent value="form" forceMount className="m-0 h-full data-[state=inactive]:hidden">
                        <FormPageDesigner config={config} orgId={orgId} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}