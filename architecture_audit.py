import os
import re

def audit_architecture():
    root_dir = 'client/src'
    issues = []

    # Regex patterns
    inline_style_pattern = re.compile(r'style=\{\{.*?\}\}')
    native_button_pattern = re.compile(r'<button(?!\s*className="[^"]*btn-native")(?![\w\s]*Button)')
    emoji_pattern = re.compile(r'[\u2600-\u26FF\u2700-\u27BF\u1F300-\u1F6FF\u1F900-\u1F9FF]')
    deep_path_pattern = re.compile(r"import .* from '\.\.\/\.\.\/")
    important_css_pattern = re.compile(r'!important')
    hardcoded_color_pattern = re.compile(r'color:\s*(?!var\(|inherit|initial|transparent|currentColor)(#[0-9a-fA-F]{3,6}|rgba?\(.*?\)|[a-zA-Z]+)')

    for root, dirs, files in os.walk(root_dir):
        # Skip node_modules if it was under src somehow
        if 'node_modules' in dirs:
            dirs.remove('node_modules')

        for file in files:
            file_path = os.path.join(root, file)
            
            # Rule 7: One Component = One CSS
            if file.endswith('.jsx'):
                css_file = file.replace('.jsx', '.css')
                if not os.path.exists(os.path.join(root, css_file)):
                    issues.append(f"[RULE 7] Missing CSS: {file_path} should have a corresponding {css_file}")

                # Read JSX content
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                    # Rule 5: Path Aliases
                    if deep_path_pattern.search(content):
                        issues.append(f"[RULE 5] Deep path imports found in {file_path}. Use @/ instead.")

                    # Rule 7: CSS Inline
                    if inline_style_pattern.search(content):
                        # Filter out common false positives if any, like Framer Motion or specific third party lib props if they are allowed
                        # But rule is strict.
                        issues.append(f"[RULE 7] Inline styles found in {file_path}")

                    # Rule 3: Use of Button atom
                    if native_button_pattern.search(content):
                        issues.append(f"[RULE 3] Native <button> found in {file_path}. Use <Button /> instead.")

                    # Rule 3: Emojis instead of Icon
                    if emoji_pattern.search(content):
                        # Simple check for emojis in JSX
                        issues.append(f"[RULE 3] Emoji found in {file_path}. Use <Icon /> instead.")

            # Rule 5: CSS Vanilla & Rule 5.2: !important
            if file.endswith('.css'):
                with open(file_path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    for i, line in enumerate(lines):
                        if important_css_pattern.search(line):
                            issues.append(f"[RULE 5.2] !important found in {file_path} at line {i+1}")
                        
                        # Rule 2: BEM Nomenclatura (Optional check: search for camelCase in selectors)
                        # This is harder to regex but we can look for .[a-z]+[A-Z]
                        if re.search(r'\.[a-z]+[A-Z][a-zA-Z]*', line):
                            issues.append(f"[RULE 2] Possible camelCase class name in {file_path} at line {i+1}")

    # Write results to artifact
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
