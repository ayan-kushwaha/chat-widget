"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FloatingNav } from "../ui/floating-navbar";
import { ShimmerButton } from "../ui/shimmer-button";
import { ChevronDown, ArrowUpRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCTS_DATA, TEMPLATES_DATA } from "@/data/products";

export function Navbar() {
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeMobileAccordion, setActiveMobileAccordion] = useState<string | null>(null);
    const pathname = usePathname();

    const toggleMobileAccordion = (name: string) => {
        setActiveMobileAccordion(activeMobileAccordion === name ? null : name);
    };

    const isActive = (path: string) => {
        if (path === "/") return pathname === "/";
        return pathname?.startsWith(path);
    };

    // Use centralized data
    const productsMenu = PRODUCTS_DATA;
    const templatesMenu = TEMPLATES_DATA;

    return (
        <FloatingNav className="max-w-7xl mx-auto px-8 py-4 flex flex-col lg:flex-row justify-between items-center rounded-3xl top-4 z-[9999]">
            <div className="w-full lg:w-auto flex justify-between items-center">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-2" onClick={() => setActiveDropdown(null)}>
                    <Image src="/logo.svg" alt="Cluaiz Logo" width={40} height={40} className="w-10 h-10" />
                    <span className="text-xl font-bold text-slate-900 dark:text-white">
                        Cluaiz
                    </span>
                </Link>

                {/* Mobile Toggle Button */}
                <button
                    className="lg:hidden p-2 text-slate-600 dark:text-slate-300 focus:outline-none"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
                {/* Products Dropdown */}
                <div
                    className="relative group"
                    onMouseEnter={() => setActiveDropdown("products")}
                    onMouseLeave={() => setActiveDropdown(null)}
                >
                    <button className={cn(
                        "flex items-center space-x-1 text-base font-medium transition-colors py-2",
                        isActive("/website") || isActive("/automation") || isActive("/ai-brain")
                            ? "text-indigo-500 font-semibold"
                            : "text-slate-600 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400"
                    )}>
                        <span>Products</span>
                        <ChevronDown className={cn("w-4 h-4 transition-transform", activeDropdown === "products" && "rotate-180")} />
                    </button>

                    {activeDropdown === "products" && (
                        <div className="absolute top-full left-0 pt-2 -translate-x-1/4">
                            <div className="w-[900px] max-w-[90vw] bg-white/70 dark:bg-slate-950/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-800/50 p-8 ring-1 ring-slate-900/5">
                                <div className="grid grid-cols-3 gap-10">
                                    {Object.entries(productsMenu).filter(([key]) => !['resources', 'templates', 'tools'].includes(key)).map(([key, section]) => (
                                        <div key={key} className="group/section">
                                            {/* Section Header */}
                                            <Link
                                                href={`/${key === 'brain' ? 'ai-brain' : key}`}
                                                onClick={() => setActiveDropdown(null)}
                                                className="flex justify-between items-start mb-6 pr-2 hover:bg-slate-50 dark:hover:bg-indigo-700/20 p-2 -ml-2 rounded-lg transition-colors"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-3xl p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg group-hover/section:scale-110 transition-transform duration-300">{section.icon}</span>
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                                                            {section.title}
                                                        </h3>
                                                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">Explore Hub</p>
                                                    </div>
                                                </div>
                                                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover/section:bg-indigo-500 group-hover/section:text-white transition-all duration-300">
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </div>
                                            </Link>

                                            {/* Items List */}
                                            <div className="space-y-3">
                                                {section.items.map((item) => {
                                                    const Icon = item.icon;
                                                    const isItemActive = pathname === item.href;
                                                    return (
                                                        <Link
                                                            key={item.name}
                                                            href={item.href}
                                                            onClick={() => setActiveDropdown(null)}
                                                            className={cn(
                                                                "block p-3 -mx-3 rounded-xl transition group/item",
                                                                isItemActive
                                                                    ? "bg-indigo-50/80 dark:bg-indigo-500/20"
                                                                    : "hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10"
                                                            )}
                                                        >
                                                            <div className="flex items-center space-x-3">
                                                                <div className={cn(
                                                                    "p-1.5 rounded-lg transition-colors",
                                                                    isItemActive ? "bg-white dark:bg-slate-700/50" : "bg-indigo-50 dark:bg-indigo-900/20 group-hover/item:bg-white dark:group-hover/item:bg-indigo-500/20"
                                                                )}>
                                                                    <Icon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                                                </div>
                                                                <div>
                                                                    <div className={cn(
                                                                        "font-semibold text-sm transition-colors",
                                                                        isItemActive ? "text-indigo-500" : "text-slate-900 dark:text-white group-hover/item:text-indigo-500"
                                                                    )}>
                                                                        {item.name}
                                                                    </div>
                                                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                                                        {item.desc}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Templates Dropdown */}
                <div
                    className="relative group"
                    onMouseEnter={() => setActiveDropdown("templates")}
                    onMouseLeave={() => setActiveDropdown(null)}
                >
                    <button className={cn(
                        "flex items-center space-x-1 text-base font-medium transition-colors py-2",
                        isActive("/templates")
                            ? "text-indigo-500 font-semibold"
                            : "text-slate-600 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400"
                    )}>
                        <span>Templates</span>
                        <ChevronDown className={cn("w-4 h-4 transition-transform", activeDropdown === "templates" && "rotate-180")} />
                    </button>

                    {activeDropdown === "templates" && (
                        <div className="absolute top-full left-0 pt-2">
                            <div className="w-64 bg-white/70 dark:bg-slate-950/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 dark:border-slate-800/50 p-4 ring-1 ring-slate-900/5">
                                <div className="flex justify-between items-center mb-4 pr-1 border-b border-slate-100 dark:border-slate-800 pb-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Templates</span>
                                    <Link
                                        href="/templates"
                                        onClick={() => setActiveDropdown(null)}
                                        className="text-[10px] uppercase font-bold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 tracking-wide flex items-center gap-1"
                                    >
                                        View All <ArrowUpRight className="w-3 h-3" />
                                    </Link>
                                </div>
                                <div className="space-y-1">
                                    {templatesMenu.map((item) => {
                                        const Icon = item.icon;
                                        const isItemActive = pathname === item.href;
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                onClick={() => setActiveDropdown(null)}
                                                className={cn(
                                                    "flex items-center space-x-3 p-2 rounded-lg transition",
                                                    isItemActive ? "bg-indigo-50/80 dark:bg-indigo-500/20" : "hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10"
                                                )}
                                            >
                                                <Icon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                                <span className={cn(
                                                    "text-sm font-medium",
                                                    isItemActive ? "text-indigo-500" : "text-slate-900 dark:text-white"
                                                )}>{item.name}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Resources Dropdown */}
                <div
                    className="relative group"
                    onMouseEnter={() => setActiveDropdown("resources")}
                    onMouseLeave={() => setActiveDropdown(null)}
                >
                    <button className={cn(
                        "flex items-center space-x-1 text-base font-medium transition-colors py-2",
                        isActive("/resources") || isActive("/docs") || isActive("/blog") || isActive("/tools")
                            ? "text-indigo-500 font-semibold"
                            : "text-slate-600 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400"
                    )}>
                        <span>Resources</span>
                        <ChevronDown className={cn("w-4 h-4 transition-transform", activeDropdown === "resources" && "rotate-180")} />
                    </button>

                    {activeDropdown === "resources" && (
                        <div className="absolute top-full left-0 pt-2">
                            <div className="w-64 bg-white/70 dark:bg-slate-950/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 dark:border-slate-800/50 p-4 ring-1 ring-slate-900/5">
                                <div className="flex justify-between items-center mb-4 pr-1 border-b border-slate-100 dark:border-slate-800 pb-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resources</span>
                                    <Link
                                        href="/resources"
                                        onClick={() => setActiveDropdown(null)}
                                        className="text-[10px] uppercase font-bold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 tracking-wide flex items-center gap-1"
                                    >
                                        View All <ArrowUpRight className="w-3 h-3" />
                                    </Link>
                                </div>
                                <div className="space-y-1">
                                    {productsMenu.resources.items.map((item) => {
                                        const Icon = item.icon;
                                        const isItemActive = pathname === item.href;
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                onClick={() => setActiveDropdown(null)}
                                                className={cn(
                                                    "flex items-center space-x-3 p-2 rounded-lg transition",
                                                    isItemActive ? "bg-indigo-50/80 dark:bg-indigo-500/20" : "hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10"
                                                )}
                                            >
                                                <Icon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                                <div>
                                                    <div className={cn(
                                                        "font-semibold text-sm",
                                                        isItemActive ? "text-indigo-500" : "text-slate-900 dark:text-white"
                                                    )}>{item.name}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Pricing Link */}
                <Link
                    href="/pricing"
                    onClick={() => setActiveDropdown(null)}
                    className={cn(
                        "text-base font-medium transition-colors",
                        isActive("/pricing")
                            ? "text-indigo-500 font-semibold"
                            : "text-slate-600 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400"
                    )}
                >
                    Pricing
                </Link>
            </div>

            {/* Desktop Right: CTA */}
            <div className="hidden lg:flex items-center space-x-6">
                <Link
                    href={process.env.NODE_ENV === 'development' ? "http://localhost:3000/login" : "https://app.cluaiz.com/login"}
                    className="text-base font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                >
                    Login
                </Link>
                <Link href={process.env.NODE_ENV === 'development' ? "http://localhost:3000/register" : "https://app.cluaiz.com/register"}>
                    <ShimmerButton className="shadow-2xl h-10 px-6">
                        <span className="whitespace-pre-wrap text-center text-base font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
                            Get Started
                        </span>
                    </ShimmerButton>
                </Link>
            </div>

            {/* Mobile Menu (Accordion Style) */}
            {isMobileMenuOpen && (
                <div className="w-full lg:hidden mt-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-2 animate-in slide-in-from-top-4 fade-in duration-300 shadow-xl">

                    {/* Products Accordion */}
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                        <button
                            onClick={() => toggleMobileAccordion("products")}
                            className="flex w-full justify-between items-center py-3 text-lg font-semibold text-slate-900 dark:text-white"
                        >
                            <span className="flex items-center gap-2">Products</span>
                            <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform duration-300", activeMobileAccordion === "products" && "rotate-180")} />
                        </button>

                        <div className={cn(
                            "grid transition-all duration-300 ease-in-out grid-rows-[0fr] opacity-0",
                            activeMobileAccordion === "products" && "grid-rows-[1fr] opacity-100 pb-4"
                        )}>
                            <div className="overflow-hidden space-y-6 pt-2">
                                {Object.entries(productsMenu).filter(([key]) => !['resources', 'templates', 'tools'].includes(key)).map(([key, section]) => (
                                    <div key={key} className="space-y-3">
                                        <div className="flex items-center gap-2 text-indigo-500 font-medium px-2">
                                            <span>{section.icon}</span>
                                            <span className="text-sm uppercase tracking-wider">{section.title}</span>
                                        </div>
                                        <div className="space-y-1">
                                            {section.items.map((item) => (
                                                <Link
                                                    key={item.name}
                                                    href={item.href}
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300"
                                                >
                                                    <item.icon className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm">{item.name}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Templates Accordion */}
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                        <button
                            onClick={() => toggleMobileAccordion("templates")}
                            className="flex w-full justify-between items-center py-3 text-lg font-semibold text-slate-900 dark:text-white"
                        >
                            <span>Templates</span>
                            <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform duration-300", activeMobileAccordion === "templates" && "rotate-180")} />
                        </button>
                        <div className={cn(
                            "grid transition-all duration-300 ease-in-out grid-rows-[0fr] opacity-0",
                            activeMobileAccordion === "templates" && "grid-rows-[1fr] opacity-100 pb-4"
                        )}>
                            <div className="overflow-hidden space-y-1">
                                {templatesMenu.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300"
                                    >
                                        <item.icon className="w-4 h-4 text-blue-500" />
                                        <span className="text-sm">{item.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Resources Accordion */}
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                        <button
                            onClick={() => toggleMobileAccordion("resources")}
                            className="flex w-full justify-between items-center py-3 text-lg font-semibold text-slate-900 dark:text-white"
                        >
                            <span>Resources</span>
                            <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform duration-300", activeMobileAccordion === "resources" && "rotate-180")} />
                        </button>
                        <div className={cn(
                            "grid transition-all duration-300 ease-in-out grid-rows-[0fr] opacity-0",
                            activeMobileAccordion === "resources" && "grid-rows-[1fr] opacity-100 pb-4"
                        )}>
                            <div className="overflow-hidden space-y-1">
                                {productsMenu.resources.items.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300"
                                    >
                                        <item.icon className="w-4 h-4 text-green-500" />
                                        <div>
                                            <div className="text-sm font-medium">{item.name}</div>
                                            <div className="text-xs text-slate-500">{item.desc}</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Footer Links */}
                    <div className="pt-4 space-y-4">
                        <Link
                            href="/pricing"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block py-2 text-lg font-semibold text-slate-900 dark:text-white hover:text-indigo-500"
                        >
                            Pricing
                        </Link>

                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <Link
                                href={process.env.NODE_ENV === 'development' ? "http://localhost:3000/login" : "https://app.cluaiz.com/login"}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex justify-center items-center h-12 rounded-xl text-base font-medium text-slate-700 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                            >
                                Login
                            </Link>
                            <Link href={process.env.NODE_ENV === 'development' ? "http://localhost:3000/register" : "https://app.cluaiz.com/register"}>
                                <ShimmerButton className="w-full h-12 shadow-lg">
                                    <span className="whitespace-pre-wrap text-center text-base font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10">
                                        Get Started
                                    </span>
                                </ShimmerButton>
                            </Link>
                        </div>
                    </div>

                </div>
            )
            }
        </FloatingNav >
    );
}
