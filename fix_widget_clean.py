import re

filepath = r"c:\Users\Aryan\my\cluaiz\Frontend\src\components\chatbot\widgets\AliveChatWidget.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove ALL corrupted image rendering code (lines 395-460 approx)
# Find pattern from line 394 closing to line with "msg.role !== 'bot'"
pattern = r"(                                \}\)\n                                \}\n                                \)\}\n).*?(\{msg\.role !== 'bot' && msg\.text && \()"

# Clean replacement
replacement = r'''\1                                {/* 🖼️ IMAGE */}
                                {msg.type === 'image' && msg.metadata?.url && (
                                    <div className="rounded-lg overflow-hidden mb-2">
                                        <img 
                                            src={msg.metadata.url} 
                                            alt="Image"
                                            className="max-w-full max-h-[300px] object-cover"
                                        />
                                    </div>
                                )}

                                {/* 🎥 VIDEO */}
                                {msg.type === 'video' && msg.metadata?.url && (
                                    <div className="rounded-lg overflow-hidden mb-2">
                                        <video 
                                            src={msg.metadata.url} 
                                            controls
                                            className="max-w-full max-h-[300px]"
                                        />
                                    </div>
                                )}

                                {/* 🎵 AUDIO */}
                                {msg.type === 'audio' && msg.metadata?.url && (
                                    <div className="rounded-lg overflow-hidden mb-2 bg-black/20 p-2">
                                        <audio 
                                            src={msg.metadata.url} 
                                            controls
                                            className="w-full"
                                        />
                                    </div>
                                )}

                                \2'''

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Widget image rendering fixed!")
