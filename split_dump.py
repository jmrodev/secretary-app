import re
import sys

def split_sql(input_file, schema_file, seed_file):
    print(f"Reading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Configuration tables to preserve, with desired order
    # Order matters: Parents first, Children last.
    dependency_order = [
        'users',              # No FK usually, or self-ref
        'active_holidays',    # Independent
        'consultorios',       # Independent
        'insurances',         # Independent
        'doctors',            # Depends on users
        'doctor_integrations' # Depends on doctors
    ]
    
    keep_tables = set(dependency_order)

    schema_lines = []
    
    # Store seed lines by table to reorder later
    # Map: table_name -> list of lines
    seed_data_by_table = {table: [] for table in keep_tables}
    
    mode = 'schema' # 'schema', 'seed', 'skip'
    current_seed_table = None
    
    dump_header_pattern = re.compile(r'^-- Dumping data for table `([^`]+)`')
    struct_header_pattern = re.compile(r'^-- Table structure for table `([^`]+)`')

    for line in lines:
        stripped = line.strip()
        
        # Check for Structure Header
        struct_match = struct_header_pattern.search(stripped)
        if struct_match:
            mode = 'schema'
            schema_lines.append(line)
            current_seed_table = None
            continue

        # Check for Dump Header
        dump_match = dump_header_pattern.search(stripped)
        if dump_match:
            table_name = dump_match.group(1)
            if table_name in keep_tables:
                mode = 'seed'
                current_seed_table = table_name
                seed_data_by_table[table_name].append(line)
            else:
                mode = 'skip'
                current_seed_table = None
            continue

        # Processing based on mode
        if mode == 'schema':
            schema_lines.append(line)
        
        elif mode == 'seed':
            if current_seed_table:
                seed_data_by_table[current_seed_table].append(line)
            
        elif mode == 'skip':
            pass

    print(f"Writing schema to {schema_file} ({len(schema_lines)} lines)")
    with open(schema_file, 'w', encoding='utf-8') as f:
        f.writelines(schema_lines)
        
    print(f"Writing seed to {seed_file} (Ordered tables)")
    with open(seed_file, 'w', encoding='utf-8') as f:
        f.write("-- Seed Data Ordered by Dependency\n\n")
        f.write("SET FOREIGN_KEY_CHECKS = 0;\n\n") # Safety net
        
        for table in dependency_order:
            data = seed_data_by_table[table]
            if data:
                print(f"  Writing {table}: {len(data)} lines")
                f.write(f"-- Data for {table}\n")
                f.writelines(data)
                f.write("\n")
            else:
                print(f"  Warning: No data found for {table}")
        
        f.write("\nSET FOREIGN_KEY_CHECKS = 1;\n")

if __name__ == "__main__":
    split_sql('server/database.sql', 'server/01-schema.sql', 'server/02-seed.sql')
