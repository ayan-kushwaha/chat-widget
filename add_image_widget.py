import re

filepath = r"c:\Users\Aryan\my\cluaiz\Frontend\src\components\chatbot\widgets\AliveChatWidget.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the line "{msg.role !== 'bot' && msg.text && ("
search_pattern = r"(\s+)\{msg\.role !== 'bot' && msg\.text && \("

# Replacement with image rendering logic
replacement = r'''\1{/* 🖼️ MEDIA RENDERING */}
\1{msg.type === 'image' && msg.metadata?.url && (
\1    <div className="rounded-lg overflow-hidden mb-2 border border-white/10">
\1        <img 
\1            src={msg.metadata.url} 
\1            alt={msg.metadata.fileName || "Image"}
\1            className="max-w-full h-auto object-cover max-h-[300px]"
\1            loading="lazy"
\1        />
\1    </div>
\1)}

\1{msg.type === 'video' && msg.metadata?.url && (
\1    <div className="rounded-lg overflow-hidden mb-2 border border-white/10">
\1        <video 
\1            src={msg.metadata.url} 
\1            controls
\1            className="max-w-full w-full rounded-lg max-h-[300px]"
\1        />
\1    </div>
\1)}

\1{msg.type === 'audio' && msg.metadata?.url && (
\1    <div className="rounded-lg overflow-hidden mb-2 border border-white/10 bg-black/20 p-2">
\1        <audio 
\1            src={msg.metadata.url} 
\1            controls
\1            className="w-full h-10"
\1        />
\1    </div>
\1)}

\1{msg.role !== 'bot' && msg.text && ('''

content = re.sub(search_pattern, replacement, content, count=1)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Image rendering added to Widget!")
