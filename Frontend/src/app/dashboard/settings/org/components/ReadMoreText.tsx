"use client";
import { useState } from "react";

export const ReadMoreText = ({ text, maxLength = 400 }: { text: string; maxLength?: number }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!text) return null;
    if (text.length <= maxLength) return <>{text}</>;

    return (
        <span>
            {isExpanded ? text : `${text.slice(0, maxLength)}... `}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-blue-500 hover:text-blue-600 font-black ml-1 text-xs uppercase tracking-tighter"
            >
                {isExpanded ? "Show Less" : "Read More"}
            </button>
        </span>
    );
};
