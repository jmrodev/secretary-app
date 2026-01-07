
import os
import zipfile
import re
import json
import xml.etree.ElementTree as ET

DATA_DIR = './Fichas medicas'
OUTPUT_FILE = 'extracted_patients.json'

def extract_text(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as zf:
            xml_content = zf.read('word/document.xml')
            root = ET.fromstring(xml_content)
            namespace = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            text = []
            for node in root.iter():
                if node.tag == '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t':
                   if node.text:
                       text.append(node.text)
            return ''.join(text)
    except Exception as e:
        print(f"Error reading {docx_path}: {e}")
        return ""

def parse_patient_data(text):
    data = {}
    
    # Simple regex based on observed pattern
    # Pattern: Name...dni...Fecha...Teléfono...Dirección
    
    # Normalize spaces
    # text = re.sub(r'\s+', ' ', text) # Actually, raw text seemed tight: "NombreAbril Mustafádni..."
    
    # Regex 1: Name
    # Look for Name...DNI
    name_match = re.search(r'Nombre(.*?)(dni|DNI)', text, re.IGNORECASE)
    if name_match:
        raw_name = name_match.group(1).strip()
        # Clean up common prefixes
        raw_name = re.sub(r'^(y\s+apellido\s*)', '', raw_name, flags=re.IGNORECASE)
        # Remove any leading punctuation/symbols often left by form fields
        raw_name = raw_name.lstrip(':._- ')
        data['name'] = raw_name
    
    # Regex 2: DNI
    # Look for DNI...Fecha OR DNI...Edad OR DNI...Sexo
    dni_match = re.search(r'dni(.*?)(Fecha|Edad|Sexo)', text, re.IGNORECASE)
    if dni_match:
        data['dni'] = dni_match.group(1).strip()
    
    # Regex 3: Birth Date (Fecha de Nacimiento)
    dob_match = re.search(r'Fecha de Nacimiento(.*?)(Sexo|Teléfono)', text, re.IGNORECASE)
    if dob_match:
        data['dob'] = dob_match.group(1).strip()

    # Regex 4: Sex
    sex_match = re.search(r'Sexo(.*?)(Teléfono|Dirección)', text, re.IGNORECASE)
    if sex_match:
        data['sex'] = sex_match.group(1).strip()

    # Regex 5: Phone
    phone_match = re.search(r'Teléfono(.*?)(Dirección|Obra)', text, re.IGNORECASE)
    if phone_match:
        data['phone'] = phone_match.group(1).strip()

    # Regex 6: Address
    address_match = re.search(r'Dirección(.*?)(Obra\s+social|$)', text, re.IGNORECASE)
    if address_match:
        data['address'] = address_match.group(1).strip()

    # Regex 7: Obra Social
    # Capturing everything after 'Obra social'
    os_match = re.search(r'Obra\s+social(.*)', text, re.IGNORECASE)
    if os_match:
        data['insurance'] = os_match.group(1).strip()
    
    # Email - generic search
    email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    if email_match:
        data['email'] = email_match.group(0).strip()
        
    return data

def main():
    patients = []
    if not os.path.exists(DATA_DIR):
        print(f"Directory {DATA_DIR} not found.")
        return

    files = [f for f in os.listdir(DATA_DIR) if f.endswith('.docx')]
    print(f"Found {len(files)} docx files.")
    
    for f in files:
        path = os.path.join(DATA_DIR, f)
        text = extract_text(path)
        if text:
            p_data = parse_patient_data(text)
            if p_data:
                # Use filename as fallback if name is completely missing or empty
                if 'name' not in p_data or not p_data['name']:
                     p_data['name_from_file'] = f.replace('.docx', '')
                
                # Add filename source for debugging
                p_data['source_file'] = f
                
                patients.append(p_data)
                
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(patients, f, indent=2)
        
    print(f"Extracted data for {len(patients)} patients. Saved to {OUTPUT_FILE}")
    
    # Print stats
    with_dni = sum(1 for p in patients if p.get('dni'))
    with_phone = sum(1 for p in patients if p.get('phone'))
    with_address = sum(1 for p in patients if p.get('address'))
    with_insurance = sum(1 for p in patients if p.get('insurance'))
    
    print(f"Stats: DNI={with_dni}, Phone={with_phone}, Address={with_address}, Insurance={with_insurance}")

if __name__ == '__main__':
    main()
