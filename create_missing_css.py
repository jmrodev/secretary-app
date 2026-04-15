import os

def create_missing_css():
    root_dir = 'client/src'
    created_count = 0

    for root, dirs, files in os.walk(root_dir):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')

        for file in files:
            if file.endswith('.jsx'):
                css_file = file.replace('.jsx', '.css')
                css_path = os.path.join(root, css_file)
                
                if not os.path.exists(css_path):
                    # Create empty CSS file with a small comment
                    with open(css_path, 'w', encoding='utf-8') as f:
                        component_name = file.replace('.jsx', '')
                        f.write(f"/* {component_name} Component Styles (BEM) */\n")
                    created_count += 1
                    print(f"Created: {css_path}")

    print(f"\nTotal CSS files created: {created_count}")

if __name__ == "__main__":
    create_missing_css()
