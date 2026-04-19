import React, { useEffect, useState } from 'react';
import Lottie, { LottieComponentProps } from 'lottie-react';

interface LottieEmojiProps extends Omit<LottieComponentProps, 'animationData'> {
    path: string;
    alt?: string;
    shouldPreload?: boolean;
}

const animationCache: Record<string, any> = {};

export const LottieEmoji: React.FC<LottieEmojiProps> = ({ path, alt, style, shouldPreload = false, ...props }) => {
    // 🧠 LOGIC REMOVED: No more lazy loading. Fetch immediately on mount.

    // Check cache first
    const [animationData, setAnimationData] = useState<any>(animationCache[path] || null);
    const [error, setError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(!!animationCache[path]);

    useEffect(() => {
        // If already loaded/cached/error, skip
        if (animationData || error) return;

        let isMounted = true;

        fetch(path)
            .then(res => {
                if (!res.ok) throw new Error('Failed to load emoji');
                return res.json();
            })
            .then(data => {
                if (isMounted) {
                    animationCache[path] = data; // Cache it
                    setAnimationData(data);
                    setIsLoaded(true);
                }
            })
            .catch(() => {
                if (isMounted) setError(true);
            });

        return () => { isMounted = false; };
    }, [path, animationData, error]);

    if (error) {
        return <span style={{ fontSize: '1.5em' }}>{alt || ''}</span>;
    }

    return (
        <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!isLoaded && (
                <span className="text-xl leading-none select-none">{alt || ''}</span>
            )}
            {isLoaded && animationData && (
                <Lottie
                    {...props}
                    animationData={animationData}
                    autoplay={true} // ⚡ ALWAYS PLAY
                    loop={true}     // ⚡ ALWAYS LOOP
                    style={style}
                />
            )}
        </div>
    );
};
