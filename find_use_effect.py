import os
import re

def find_use_effects():
    use_effect_pattern = re.compile(r'useEffect\(\s*\(\s*\)\s*=>\s*\{([\s\S]*?)\}\s*,\s*\[([\s\S]*?)\]\s*\)', re.MULTILINE)
    
    for root, dirs, files in os.walk('src'):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Simple search for useEffects
                matches = re.finditer(r'useEffect\s*\(', content)
                for m in matches:
                    start_idx = m.start()
                    # Find matching braces or parenthesis to extract the useEffect block
                    brace_count = 0
                    paren_count = 0
                    end_idx = start_idx
                    for i in range(start_idx, len(content)):
                        char = content[i]
                        if char == '(':
                            paren_count += 1
                        elif char == ')':
                            paren_count -= 1
                            if paren_count == 0:
                                end_idx = i + 1
                                break
                    
                    block = content[start_idx:end_idx]
                    # Print filename and block to help debug
                    # Just print if we see setState or update in block
                    # extract dependency array at the end of block
                    dep_match = re.search(r'\]\s*\)$', block)
                    if dep_match:
                        # find last '[' before the end
                        last_bracket = block.rfind('[')
                        deps = block[last_bracket:len(block)-1].strip()
                        # If dependencies has objects or arrays, or looks suspicious
                        print(f"File: {path} | Deps: {deps}")
                        if "set" in block and len(deps) > 2:
                            print(f"--- Suspicious useEffect block in {file} (contains 'set' and has deps) ---")
                            print(block[:300] + "...")

if __name__ == '__main__':
    find_use_effects()
