filepath = r'c:\Users\Aryan\my\cluaiz\Frontend\src\components\chatbot\messaging\MessageBubble.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add debug log
old_code = 'const fixMinIOUrl = (url: string | undefined): string | undefined => {\r\n    if (!url) return url;'
new_code = 'const fixMinIOUrl = (url: string | undefined): string | undefined => {\r\n    console.log("[DEBUG] fixMinIOUrl input:", url);\r\n    if (!url) return url;'

content = content.replace(old_code, new_code)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Debug log added!")
