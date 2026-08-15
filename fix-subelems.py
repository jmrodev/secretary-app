import os
import re

for root, dirs, files in os.walk("client/src"):
    for file in files:
        if file.endswith(".module.css"):
            basename = file.replace(".module.css", "")
            filepath = os.path.join(root, file)
            with open(filepath, "r") as f:
                content = f.read()
            
            def replacer(m):
                return f".{m.group(1)}__{m.group(2)}"
            
            # Allow hyphens in the middle parts!
            content, count = re.subn(r'\.([A-Z][a-zA-Z0-9]+)__[a-zA-Z0-9-]+__([a-zA-Z0-9-]+)', replacer, content)
            
            if count > 0:
                with open(filepath, "w") as f:
                    f.write(content)
                
                jsx_path = filepath.replace(".module.css", ".jsx")
                if not os.path.exists(jsx_path):
                    jsx_path = filepath.replace(".module.css", ".tsx")
                
                if os.path.exists(jsx_path):
                    with open(jsx_path, "r") as f:
                        jsx = f.read()
                    
                    def jsx_replacer(m):
                        return f"styles[{m.group(1)}{m.group(2)}__{m.group(3)}"
                        
                    jsx, jsx_count = re.subn(r"styles\[(['\"])([A-Z][a-zA-Z0-9]+)__[a-zA-Z0-9-]+__([a-zA-Z0-9-]+)", jsx_replacer, jsx)
                    
                    if jsx_count > 0:
                        with open(jsx_path, "w") as f:
                            f.write(jsx)

