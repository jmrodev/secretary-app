import os
import re

for root, dirs, files in os.walk("client/src"):
    for file in files:
        if file.endswith(".module.css"):
            basename = file.replace(".module.css", "")
            filepath = os.path.join(root, file)
            with open(filepath, "r") as f:
                content = f.read()
            
            # fix Name__name__ something
            # capitalize first letter to match
            lower_base = basename[0].lower() + basename[1:]
            
            # double prefix
            content = re.sub(r'\.' + basename + r'__' + basename + r'__', f'.{basename}__', content)
            content = re.sub(r'\.' + basename + r'__' + lower_base + r'__', f'.{basename}__', content)
            
            content = re.sub(r'\.' + basename + r'__' + basename + r'(?=[^a-zA-Z0-9_-])', f'.{basename}', content)
            content = re.sub(r'\.' + basename + r'__' + lower_base + r'(?=[^a-zA-Z0-9_-])', f'.{basename}', content)

            with open(filepath, "w") as f:
                f.write(content)
            
            jsx_path = filepath.replace(".module.css", ".jsx")
            if not os.path.exists(jsx_path):
                # check pages / components
                possible = filepath.replace(".module.css", ".tsx")
                if os.path.exists(possible):
                    jsx_path = possible

            if os.path.exists(jsx_path):
                with open(jsx_path, "r") as f:
                    jsx = f.read()
                jsx = re.sub(r"styles\['" + basename + r"__" + basename + r"__", f"styles['{basename}__", jsx)
                jsx = re.sub(r"styles\['" + basename + r"__" + lower_base + r"__", f"styles['{basename}__", jsx)
                jsx = re.sub(r"styles\['" + basename + r"__" + basename + r"'\]", f"styles['{basename}']", jsx)
                jsx = re.sub(r"styles\['" + basename + r"__" + lower_base + r"'\]", f"styles['{basename}']", jsx)
                
                with open(jsx_path, "w") as f:
                    f.write(jsx)

