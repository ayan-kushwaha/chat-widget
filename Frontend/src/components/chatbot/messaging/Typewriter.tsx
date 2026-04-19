"use client";

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TypewriterProps {
    text: string;
    onComplete?: () => void;
    searchQuery?: string;
}

const Highlight = ({ text, query }: { text: string, query: string }) => {
    if (!query || !text || typeof text !== 'string') return <>{text}</>;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase()
                    ? <mark key={i} className="bg-yellow-400 text-green-950 px-0.5 rounded font-bold shadow-sm inline-block leading-normal">{part}</mark>
                    : part
            )}
        </>
    );
};

const highlightChildren = (children: React.ReactNode, query: string): React.ReactNode => {
    if (!query) return children;
    return React.Children.map(children, (child) => {
        if (typeof child === 'string') {
            return <Highlight text={child} query={query} />;
        }
        if (React.isValidElement(child)) {
            const element = child as React.ReactElement<any>;
            if (element.props.children) {
                return React.cloneElement(element, {
                    children: highlightChildren(element.props.children, query)
                });
            }
        }
        return child;
    });
};

export const Typewriter: React.FC<TypewriterProps> = ({ text, onComplete, searchQuery }) => {
    const [displayedText, setDisplayedText] = useState('');
    const onCompleteRef = useRef(onComplete);

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        const trimmedText = text.trimStart();
        setDisplayedText('');
        let index = 0;
        let isCancelled = false;

        const interval = setInterval(() => {
            if (isCancelled) return;

            if (index < trimmedText.length) {
                // Append 3 characters at once for better performance
                const chunkSize = 3;
                const nextIndex = Math.min(index + chunkSize, trimmedText.length);
                setDisplayedText(trimmedText.substring(0, nextIndex));
                index = nextIndex;
            } else {
                clearInterval(interval);
                if (onCompleteRef.current) {
                    onCompleteRef.current();
                }
            }
        }, 30); // Increased from 12ms to 30ms

        return () => {
            isCancelled = true;
            clearInterval(interval);
        };
    }, [text]);

    return (
        <div className="prose prose-sm max-w-none transition-colors
            prose-p:text-inherit prose-li:text-inherit prose-blockquote:text-inherit prose-td:text-inherit prose-th:text-inherit
            prose-headings:text-emerald-400 prose-headings:font-bold
            prose-strong:text-emerald-400 prose-strong:font-bold
            prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-a:underline
            prose-code:text-amber-300 prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
            prose-p:leading-relaxed prose-p:mb-2 prose-li:my-0.5">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    p: ({ children }) => <p>{highlightChildren(children, searchQuery || '')}</p>,
                    li: ({ children }) => <li>{highlightChildren(children, searchQuery || '')}</li>,
                    span: ({ children }) => <span>{highlightChildren(children, searchQuery || '')}</span>,
                    strong: ({ children }) => <strong>{highlightChildren(children, searchQuery || '')}</strong>,
                    em: ({ children }) => <em>{highlightChildren(children, searchQuery || '')}</em>,
                    h1: ({ children }) => <h1>{highlightChildren(children, searchQuery || '')}</h1>,
                    h2: ({ children }) => <h2>{highlightChildren(children, searchQuery || '')}</h2>,
                    h3: ({ children }) => <h3>{highlightChildren(children, searchQuery || '')}</h3>,
                }}
            >
                {displayedText}
            </ReactMarkdown>
        </div>
    );
};
