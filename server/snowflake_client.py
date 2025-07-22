import snowflake.connector
from config import get_database_config, get_available_databases, BASE_SNOWFLAKE_CONFIG
from functools import lru_cache

def test_database_connection(database_key):
    """Test connection to a specific database"""
    try:
        config = get_database_config(database_key)
        conn = snowflake.connector.connect(**config)
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result[0] == 1
    except Exception as e:
        print(f"Connection test failed for {database_key}: {str(e)}")
        return False

def get_available_schemas(database_key):
    """Get available schemas for a database"""
    try:
        config = get_database_config(database_key)
        conn = snowflake.connector.connect(**config)
        cursor = conn.cursor()
        
        # Use the database
        cursor.execute(f"USE DATABASE {config['database']}")
        
        # Show schemas
        cursor.execute("SHOW SCHEMAS")
        
        schemas = []
        for row in cursor.fetchall():
            schema_name = row[1]  # schema name
            schemas.append({
                'name': schema_name,
                'key': schema_name.lower()
            })
        
        cursor.close()
        conn.close()
        
        return schemas
    except Exception as e:
        print(f"Failed to get schemas for {database_key}: {str(e)}")
        return []

def get_available_tables(database_key, schema_name=None):
    """Get available tables for a database and schema"""
    try:
        config = get_database_config(database_key)
        conn = snowflake.connector.connect(**config)
        cursor = conn.cursor()
        
        # Use the database
        cursor.execute(f"USE DATABASE {config['database']}")
        
        # Use schema if specified, otherwise use default
        if schema_name:
            cursor.execute(f"USE SCHEMA {schema_name}")
        else:
            cursor.execute(f"USE SCHEMA {config['schema']}")
        
        # Show tables
        cursor.execute("SHOW TABLES")
        
        tables = []
        for row in cursor.fetchall():
            table_name = row[1]  # table name
            tables.append({
                'name': table_name,
                'key': table_name.lower()
            })
        
        cursor.close()
        conn.close()
        
        return tables
    except Exception as e:
        print(f"Failed to get tables for {database_key}: {str(e)}")
        return []

def get_table_info(table_name, database_key, schema_name=None):
    """Get detailed information about a table"""
    try:
        config = get_database_config(database_key)
        conn = snowflake.connector.connect(**config)
        cursor = conn.cursor()
        
        # Use the database
        cursor.execute(f"USE DATABASE {config['database']}")
        
        # Use schema if specified, otherwise use default
        if schema_name:
            cursor.execute(f"USE SCHEMA {schema_name}")
        else:
            cursor.execute(f"USE SCHEMA {config['schema']}")
        
        # Describe table
        cursor.execute(f"DESCRIBE TABLE {table_name}")
        
        columns = []
        for row in cursor.fetchall():
            columns.append({
                'name': row[0],
                'type': row[1],
                'kind': row[2],
                'null': row[3],
                'default': row[4],
                'primary_key': row[5],
                'unique_key': row[6],
                'check': row[7],
                'expression': row[8],
                'comment': row[9]
            })
        
        cursor.close()
        conn.close()
        
        return {
            'table_name': table_name,
            'database': database_key,
            'schema': schema_name or config['schema'],
            'columns': columns
        }
    except Exception as e:
        print(f"Failed to get table info for {table_name}: {str(e)}")
        raise ValueError(f"Table '{table_name}' not found or inaccessible")

def fetch_table_data(table_name, database_key, schema_name=None, limit=100, offset=0, search=''):
    """Fetch data from a table with pagination and search"""
    try:
        config = get_database_config(database_key)
        conn = snowflake.connector.connect(**config)
        cursor = conn.cursor()
        
        # Use the database
        cursor.execute(f"USE DATABASE {config['database']}")
        
        # Use schema if specified, otherwise use default
        if schema_name:
            cursor.execute(f"USE SCHEMA {schema_name}")
        else:
            cursor.execute(f"USE SCHEMA {config['schema']}")
        
        # Build query with search
        if search:
            # Get column names first
            cursor.execute(f"SELECT * FROM {table_name} LIMIT 0")
            columns = [desc[0] for desc in cursor.description]
            
            # Build search conditions
            search_conditions = []
            for col in columns:
                search_conditions.append(f"CAST({col} AS STRING) ILIKE '%{search}%'")
            
            search_clause = " OR ".join(search_conditions)
            query = f"SELECT * FROM {table_name} WHERE {search_clause} LIMIT {limit} OFFSET {offset}"
        else:
            query = f"SELECT * FROM {table_name} LIMIT {limit} OFFSET {offset}"
        
        cursor.execute(query)
        
        # Get column names
        columns = [desc[0] for desc in cursor.description]
        
        # Get data
        rows = []
        for row in cursor.fetchall():
            row_dict = {}
            for i, value in enumerate(row):
                row_dict[columns[i]] = value
            rows.append(row_dict)
        
        cursor.close()
        conn.close()
        
        return columns, rows
    except Exception as e:
        print(f"Failed to fetch data from {table_name}: {str(e)}")
        raise ValueError(f"Failed to fetch data from table '{table_name}'")

@lru_cache(maxsize=1)
def discover_all_databases():
    """Discover all available databases in Snowflake account"""
    try:
        # Use the default config to connect
        config = get_database_config('default')
        conn = snowflake.connector.connect(**config)
        cursor = conn.cursor()

        # Show all databases
        cursor.execute("SHOW DATABASES")

        databases = []
        for row in cursor.fetchall():
            db_name = row[1]  # database name
            databases.append({
                'key': db_name.lower(),
                'name': db_name.upper(),
                'database': db_name
            })

        cursor.close()
        conn.close()

        return databases

    except Exception as e:
        # Fallback to configured databases if discovery fails
        print(f"Database discovery failed: {str(e)}")
        return [
            {
                'key': 'default',
                'name': 'DEFAULT',
                'database': config.get('database', 'LLM_EVAL')
            }
        ] 