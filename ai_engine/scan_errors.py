import os
import ast

def find_syntax_errors(start_dir):
    broken_files = []
    for root, dirs, files in os.walk(start_dir):
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        source = f.read()
                    ast.parse(source, filename=filepath)
                except SyntaxError as e:
                    broken_files.append(f"{filepath} - Line {e.lineno}: {e.msg}")
                except Exception as e:
                    broken_files.append(f"{filepath} - Other error: {e}")
    
    with open('syntax_errors.txt', 'w', encoding='utf-8') as f:
        for bf in broken_files:
            f.write(bf + '\n')
    print(f"Found {len(broken_files)} files with syntax errors.")

if __name__ == "__main__":
    find_syntax_errors('src')
