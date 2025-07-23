import os

# Base Snowflake configuration
BASE_SNOWFLAKE_CONFIG = {
    'user': os.getenv('SNOWFLAKE_USER', ''),
    'password': os.getenv('SNOWFLAKE_PASSWORD', ''),
    'account': os.getenv('SNOWFLAKE_ACCOUNT', ''),
    'warehouse': os.getenv('SNOWFLAKE_WAREHOUSE', ''),
    'role': os.getenv('SNOWFLAKE_ROLE', ''),
}

# Database configurations
DATABASES = {
    'default': {
        'database': os.getenv('SNOWFLAKE_DATABASE', ''),
        'schema': os.getenv('SNOWFLAKE_SCHEMA', '').split('.')[-1]  # Just the schema part
    }
}

def get_available_databases():
    """Get list of available database configurations"""
    return list(DATABASES.keys())

def get_database_config(database_key):
    """Get configuration for a specific database"""
    if database_key not in DATABASES:
        raise ValueError(f"Database '{database_key}' not found")
    
    config = BASE_SNOWFLAKE_CONFIG.copy()
    config.update(DATABASES[database_key])
    return config 