import os
import re

def audit_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    issues = []
    
    # 1. Check for "Div-soup" (indiscriminate use of divs in components that could be semantic)
    # This is hard to detect perfectly, but we can look for large blocks that don't use semantic tags.
    if '<div' in content and not any(tag in content for tag in ['<section', '<article', '<main', '<header', '<footer', '<aside']):
        # If it's a "Page" or "Manager" or "Orchestrator", it definitely should have semantic tags.
        if 'Page' in filepath or 'Manager' in filepath:
            issues.append(f"MISSING_SEMANTIC_TAGS: Component seems to be a view/orchestrator but relies only on <div>.")

    # 2. Check for <section> or <article> without headings (Rule 204)
    # Regex to find sections/articles
    containers = re.findall(r'<(section|article)[^>]*>', content)
    if containers:
        # Check if there is at least one heading in the file if these are present
        if not re.search(r'<h[1-6][^>]*>', content):
             issues.append(f"SECTION_WITHOUT_HEADING: Found {len(containers)} <section>/<article> tags but no <h1-6> headings.")

    # 3. Check for native <button> usage (Prohibited by Rule 30)
    if '<button' in content and 'Button' not in content:
        issues.append("NATIVE_BUTTON: Use <Button /> atom instead.")

    # 4. Check for native <img> instead of custom handling if applicable (not strictly prohibited but good to check)
    # if '<img' in content:
    #     issues.append("NATIVE_IMG: Verify if it should be an atom or Icon.")

    # 5. Check for inline styles (Rule 77)
    if 'style={{' in content:
        issues.append("INLINE_STYLES: style={{...}} found. Use CSS files.")

    return issues

def main():
    base_path = './client/src'
    report = []
    
    print("Auditing frontend semantics and architecture...")
    
    for root, dirs, files in os.walk(base_path):
        for file in files:
            if file.endswith('.jsx'):
                path = os.path.join(root, file)
                file_issues = audit_file(path)
                if file_issues:
                    report.append(f"### {path}")
                    for issue in file_issues:
                        report.append(f"- {issue}")
    
    if report:
        with open('semantic_audit_results.md', 'w') as f:
            f.write("# Semantic & Architecture Audit Results\n\n")
            f.write("\n".join(report))
        print("Audit complete. Results saved to semantic_audit_results.md.")
    else:
        print("Audit complete. No semantic issues found!")

if __name__ == "__main__":
    main()
