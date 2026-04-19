'use client';

import React, { useState } from 'react';
import AiBot from '@/components/chatbot/widgets/AiBot';

export default function LauncherPage() {
  const [interactionState, setInteractionState] = useState<'idle' | 'love'>('idle');

  const handleClick = () => {
    // Notify parent (widget.js) to toggle the chat window
    window.parent.postMessage({ type: 'CLUAIZ_TOGGLE_CHAT' }, '*');
  };

  // Listen for interaction events from parent (forwarded from chat iframe)
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'CLUAIZ_BOT_INTERACTION') {
        setInteractionState(event.data.state);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div
      className="flex items-center justify-center w-full h-full bg-transparent cursor-pointer select-none"
      onClick={handleClick}
      onMouseEnter={() => setInteractionState('love')}
      onMouseLeave={() => setInteractionState('idle')}
      style={{ overflow: 'visible' }}
    >
      {/* 
        Using AiBot directly ensures 100% visual consistency.
        Size is set to match the widget configuration.
      */}
      <AiBot
        size={80}
        interactionState={interactionState}
        bodyColor="#FFFFFF"
        eyeColor="#3B82F6"
        lipColor="#F472B6"
      />
    </div>
  );
}
