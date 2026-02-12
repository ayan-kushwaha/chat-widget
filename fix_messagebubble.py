import sys
sys.path.insert(0, 'c:/Users/Aryan/my/cluaiz/')

filepath = r'c:\Users\Aryan\my\cluaiz\Frontend\src\components\chatbot\messaging\MessageBubble.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the line with "if (!url) return url;" and add local storage handling after it
new_lines = []
for i, line in enumerate(lines):
    new_lines.append(line)
    if i < len(lines) - 1 and '    if (!url) return url;' in line and '// Replace old bucket' in lines[i+2]:
        # Insert after the blank line
        new_lines.append('    \r\n')
        new_lines.append('    // Handle local storage URLs (from fallback)\r\n')
        new_lines.append('    if (url.startsWith(\'/static/uploads\')) {\r\n')
        new_lines.append('        return `http://127.0.0.1:5000${url}`;\r\n')
        new_lines.append('    }\r\n')

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("✅ File updated successfully!")
