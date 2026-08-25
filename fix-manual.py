import re

def update_jsx(jsx_path, basename, classes):
    with open(jsx_path, "r") as f:
        content = f.read()
    
    sorted_classes = sorted(list(classes), key=len, reverse=True)
    for c in sorted_classes:
        content = re.sub(r'styles\.' + re.escape(c) + r'(?![a-zA-Z0-9_-])', f'styles.{basename}__{c}', content)
        content = re.sub(r"styles\['" + re.escape(c) + r"'\]", f"styles['{basename}__{c}']", content)
        content = re.sub(r'styles\["' + re.escape(c) + r'"\]', f"styles['{basename}__{c}']", content)
        
    with open(jsx_path, "w") as f:
        f.write(content)

# OutreachPage
outreach_classes = ["outreach", "outreach__title", "outreach__steps", "outreach__step", "outreach__step--active", "outreach__step--completed", "outreach__step-number", "outreach__step-label", "outreach__content", "outreach__progress", "outreach__progress-bar"]
update_jsx("client/src/features/outreach/pages/OutreachPage.jsx", "OutreachPage", outreach_classes)

# MedicalReportTable
medical_classes = ["table", "table__wrapper", "table__header", "table__header-cell", "table__row", "table__cell"]
update_jsx("client/src/features/reports/components/tables/CertificateReportTable.jsx", "MedicalReportTable", medical_classes)
update_jsx("client/src/features/reports/components/tables/LicenseReportTable.jsx", "MedicalReportTable", medical_classes)

