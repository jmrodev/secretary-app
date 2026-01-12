import re

def extract_patients(input_file, output_file):
    print(f"Reading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("-- Restore Patients Script\n")
        f.write("SET FOREIGN_KEY_CHECKS = 0;\n\n")

        # 1. Extract Users (Role = patient)
        # Pattern: (id, 'username', 'hash', 'role', ...)
        # We need to parse the INSERT INTO `users` block
        
        in_users_insert = False
        user_values_buffer = []
        
        print("Scanning for Patient Users...")
        f.write("-- Users (Role: patient)\n")
        f.write("INSERT INTO `users` VALUES \n")
        
        first_user = True
        
        for line in lines:
            line = line.strip()
            if line.startswith("INSERT INTO `users` VALUES"):
                in_users_insert = True
                continue
            
            if in_users_insert:
                if line.endswith(";"):
                    in_users_insert = False
                    # Check last line
                    if "'patient'" in line:
                         # Handle semi-colon
                         val = line.rstrip(";")
                         if not first_user: f.write(",\n")
                         f.write(val)
                         first_user = False
                    break
                
                # It's a value line (ending in comma)
                if "'patient'" in line:
                    val = line.rstrip(",")
                    if not first_user: f.write(",\n")
                    f.write(val)
                    first_user = False

        f.write(";\n\n")

        # 2. Extract Patients Table (All of it)
        print("Scanning for Patients Table...")
        f.write("-- Patients Profile Data\n")
        
        in_patients_insert = False
        
        for line in lines:
            if line.startswith("INSERT INTO `patients` VALUES"):
                in_patients_insert = True
                f.write(line) # Write the INSERT statement
                continue
            
            if in_patients_insert:
                f.write(line)
                if line.strip().endswith(";"):
                    in_patients_insert = False
                    break
        
        f.write("\nSET FOREIGN_KEY_CHECKS = 1;\n")
        print(f"Done. Wrote to {output_file}")

if __name__ == "__main__":
    extract_patients('server/database.sql', 'server/03-restore-patients.sql')
