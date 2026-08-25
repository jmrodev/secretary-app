import os
import re

directories = [
    "client/src/features/institutions",
    "client/src/features/outreach",
    "client/src/features/auth",
    "client/src/features/chat",
    "client/src/features/config",
    "client/src/features/finances",
    "client/src/features/doctors",
    "client/src/features/reports"
]

files_to_update = []

for d in directories:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith(".module.css"):
                path = os.path.join(root, file)
                basename = file.split(".module.css")[0]
                with open(path, "r") as f:
                    content = f.read()
                
                classes = re.findall(r"\.([a-zA-Z_][a-zA-Z0-9_-]*)", content)
                non_bem_classes = set([c for c in classes if not c.startswith(basename)])
                
                if non_bem_classes:
                    files_to_update.append((path, basename, non_bem_classes))

print(f"Found {len(files_to_update)} CSS module files to refactor")

for css_path, basename, classes in files_to_update:
    with open(css_path, "r") as f:
        css_content = f.read()
    
    sorted_classes = sorted(list(classes), key=len, reverse=True)
    
    for c in sorted_classes:
        css_content = re.sub(r'(?<![a-zA-Z0-9_-])\.' + re.escape(c) + r'(?![a-zA-Z0-9_-])', f'.{basename}__{c}', css_content)
    
    with open(css_path, "w") as f:
        f.write(css_content)
        
    jsx_path = css_path.replace(".module.css", ".jsx")
    if not os.path.exists(jsx_path):
        jsx_path = css_path.replace(".module.css", ".tsx")
        
    if os.path.exists(jsx_path):
        with open(jsx_path, "r") as f:
            jsx_content = f.read()
            
        for c in sorted_classes:
            jsx_content = re.sub(r'styles\.' + re.escape(c) + r'(?![a-zA-Z0-9_-])', f'styles.{basename}__{c}', jsx_content)
            jsx_content = re.sub(r"styles\['" + re.escape(c) + r"'\]", f"styles['{basename}__{c}']", jsx_content)
            jsx_content = re.sub(r'styles\["' + re.escape(c) + r'"\]', f"styles['{basename}__{c}']", jsx_content)

        with open(jsx_path, "w") as f:
            f.write(jsx_content)
    else:
        print(f"Could not find JSX for {css_path}")

print("Done refactoring CSS and JSX files!")
