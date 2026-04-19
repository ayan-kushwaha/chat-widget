"use client";

import React from 'react';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';

interface LocationCardProps {
    lat: number;
    lng: number;
    address: string;
}

export const LocationCard: React.FC<LocationCardProps> = ({ lat, lng, address }) => {
    // Generate Google Maps Static URL (or just use a placeholder based on lat/lng mostly for visual)
    // Using a dark map style placeholder for now or standard placeholder
    // In real app, you'd use a Google Static Maps API key or Mapbox

    // Fallback static map generator using OSM static maps or just a generic map pattern
    // For this demo, we'll visually simulate it with a pattern and a pin

    return (
        <div className="bg-[#1e293b] border border-orange-500/30 rounded-2xl overflow-hidden max-w-[280px] shadow-lg">
            {/* Map Preview Area */}
            <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-32 bg-zinc-800 relative group cursor-pointer overflow-hidden"
            >
                {/* Simulated Map Background */}
                <div className="absolute inset-0 opacity-40 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover bg-center grayscale invert" />

                {/* Pin Animation */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <MapPin size={32} className="text-orange-500 fill-orange-500/20 drop-shadow-xl animate-bounce" />
                    <div className="w-8 h-2 bg-black/50 blur-sm rounded-[100%] absolute -bottom-1 left-1/2 -translate-x-1/2 animate-pulse" />
                </div>

                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
            </a>

            <div className="p-4">
                <h3 className="font-bold text-white text-sm leading-tight mb-1">Shared Location</h3>
                <p className="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed">{address}</p>

                <div className="flex gap-2">
                    <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-orange-600/20"
                    >
                        <Navigation size={14} /> Navigate
                    </a>
                </div>
            </div>
        </div>
    );
};
