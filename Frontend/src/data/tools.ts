import { Wrench, Search, Phone, Mail, Globe, Database, FileText } from "lucide-react";

export interface ToolItem {
    name: string;
    desc: string;
    href: string;
    icon: any;
    category: string;
}

export const TOOLS_DATA: ToolItem[] = [
    { name: "Competitor Analyzer", desc: "Analyze your competitors' strategy instantly.", href: "#", icon: Search, category: "analysis" },
    { name: "SEO Checker", desc: "Get a full SEO audit of your site.", href: "#", icon: Globe, category: "analysis" },
    { name: "Lead Extractor", desc: "Extract valid leads from any website.", href: "#", icon: Database, category: "extraction" },
    { name: "Email Validator", desc: "Verify email lists cleaning.", href: "#", icon: Mail, category: "extraction" },
    { name: "Phone Scraper", desc: "Find phone numbers from domains.", href: "#", icon: Phone, category: "extraction" },
    { name: "Headline Generator", desc: "Generate catchy headlines for ads.", href: "#", icon: FileText, category: "content" },
];

export const TOOL_CATEGORIES = {
    "analysis": { name: "Analysis", icon: Search, id: "analysis" },
    "extraction": { name: "Extraction", icon: Database, id: "extraction" },
    "content": { name: "Content", icon: FileText, id: "content" }
};
