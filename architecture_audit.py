import os
import re

def audit_architecture():
    root_dir = 'client/src'
    issues = []

    # Regex patterns
    inline_style_pattern = re.compile(r'style=\{\{.*?\}\}')
    native_button_pattern = re.compile(r'<button(?!\s*className="[^"]*btn-native")(?![\w\s]*Button)')
    emoji_pattern = re.compile(r'[\u2600-\u26FF\u2700-\u27BF\U0001F300-\U0001F6FF\U0001F900-\U0001F9FF]')
    deep_path_pattern = re.compile(r"import .* from '\.\.\/\.\.\/")

    # Files allowed to have native buttons (Atoms)
    allowed_native_buttons = ['Button.jsx', 'TabButton.jsx', 'Switch.jsx']

    for root, dirs, files in os.walk(root_dir):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')

        for file in files:
            file_path = os.path.join(root, file)
            
            if file.endswith('.jsx'):
                css_file = file.replace('.jsx', '.css')
                if not os.path.exists(os.path.join(root, css_file)):
                    issues.append(f"[RULE 7] Missing CSS: {file_path}")

                with open(file_path, 'r', encoding='utf-8') as f:
                    try:
                        lines = f.readlines()
                        for i, line in enumerate(lines):
                            if inline_style_pattern.search(line):
                                issues.append(f"[RULE 7] Inline styles in {file_path}:{i+1}")

                            if native_button_pattern.search(line) and file not in allowed_native_buttons:
                                issues.append(f"[RULE 3] Native <button> in {file_path}:{i+1}")

                            match_emoji = emoji_pattern.search(line)
                            if match_emoji:
                                found = match_emoji.group(0)
                                issues.append(f"[RULE 3] Emoji found in {file_path}:{i+1} ('{found}')")

                            if deep_path_pattern.search(line):
                                issues.append(f"[RULE 5] Deep path in {file_path}:{i+1}")
                    except UnicodeDecodeError:
                        pass

            if file.endswith('.css'):
                with open(file_path, 'r', encoding='utf-8') as f:
                    try:
                        lines = f.readlines()
                        for i, line in enumerate(lines):
                            if '!important' in line and not line.strip().startswith('/*'):
                                issues.append(f"[RULE 5.2] !important in {file_path}:{i+1}")
                    except UnicodeDecodeError:
                        pass

    with open('architecture_audit_results.md', 'w', encoding='utf-8') as f:
        f.write("# Arquitecura Audit Results\n\n")
        if not issues:
            f.write("✅ No architecture issues found!\n")
        else:
            f.write(f"Found {len(issues)} issues:\n\n")
            for issue in issues:
                f.write(f"- {issue}\n")

if __name__ == "__main__":
    audit_architecture()
