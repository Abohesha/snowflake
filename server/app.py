from flask import Flask, jsonify, request
from flask_cors import CORS
from snowflake_client import (
    fetch_table_data, get_available_tables, get_table_info,
    get_available_schemas, discover_all_databases, test_database_connection
)
from config import get_database_config, get_available_databases

app = Flask(__name__)
CORS(app)

@app.route('/api/databases', methods=['GET'])
def get_databases():
    """Get list of available databases"""
    try:
        databases = discover_all_databases()
        return jsonify(databases)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/databases/info', methods=['GET'])
def get_databases_info():
    """Get detailed information about all databases"""
    try:
        databases = discover_all_databases()
        info = []
        for db in databases:
            try:
                test_result = test_database_connection(db['key'])
                info.append({
                    'key': db['key'],
                    'name': db['name'],
                    'database': db['database'],
                    'status': 'connected' if test_result else 'failed'
                })
            except:
                info.append({
                    'key': db['key'],
                    'name': db['name'],
                    'database': db['database'],
                    'status': 'failed'
                })
        return jsonify(info)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/databases/<database_key>/test', methods=['GET'])
def test_database(database_key):
    """Test connection to a specific database"""
    try:
        result = test_database_connection(database_key)
        return jsonify({'connected': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/databases/<database_key>/schemas', methods=['GET'])
def get_schemas(database_key):
    """Get available schemas for a database"""
    try:
        schemas = get_available_schemas(database_key)
        return jsonify(schemas)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/databases/<database_key>/tables', methods=['GET'])
def get_tables(database_key):
    """Get available tables for a database (default schema)"""
    try:
        tables = get_available_tables(database_key)
        return jsonify(tables)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/databases/<database_key>/schemas/<schema_name>/tables', methods=['GET'])
def get_tables_in_schema(database_key, schema_name):
    """Get available tables for a specific schema"""
    try:
        tables = get_available_tables(database_key, schema_name)
        return jsonify(tables)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/databases/<database_key>/tables/<table_name>/info', methods=['GET'])
def get_table_info_endpoint(database_key, table_name):
    """Get table information for a table in default schema"""
    try:
        info = get_table_info(table_name, database_key)
        return jsonify(info)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/databases/<database_key>/schemas/<schema_name>/tables/<table_name>/info', methods=['GET'])
def get_table_info_in_schema(database_key, schema_name, table_name):
    """Get table information for a table in specific schema"""
    try:
        info = get_table_info(table_name, database_key, schema_name)
        return jsonify(info)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/databases/<database_key>/data/<table_name>', methods=['GET'])
def get_table_data(database_key, table_name):
    """Get table data for a table in default schema"""
    try:
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        search = request.args.get('search', '')
        
        print(f"🔍 API Request: {database_key}.{table_name}")
        columns, rows = fetch_table_data(table_name, database_key, limit=limit, offset=offset, search=search)
        print(f"✅ Success: Found {len(rows)} rows")
        
        return jsonify({
            'columns': columns,
            'rows': rows,
            'metadata': {
                'table_name': table_name,
                'database': database_key,
                'limit': limit,
                'offset': offset,
                'total_rows': len(rows),
                'has_more': len(rows) == limit
            }
        })
    except ValueError as ve:
        print(f"❌ Error: {str(ve)}")
        return jsonify({'error': str(ve)}), 404
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/databases/<database_key>/schemas/<schema_name>/data/<table_name>', methods=['GET'])
def get_table_in_schema(database_key, schema_name, table_name):
    """Get table data for a table in specific schema"""
    try:
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        search = request.args.get('search', '')
        
        print(f"🔍 API Request: {database_key}.{schema_name}.{table_name}")
        columns, rows = fetch_table_data(table_name, database_key, schema_name=schema_name, limit=limit, offset=offset, search=search)
        print(f"✅ Success: Found {len(rows)} rows")
        
        return jsonify({
            'columns': columns,
            'rows': rows,
            'metadata': {
                'table_name': table_name,
                'database': database_key,
                'schema': schema_name,
                'limit': limit,
                'offset': offset,
                'total_rows': len(rows),
                'has_more': len(rows) == limit
            }
        })
    except ValueError as ve:
        print(f"❌ Error: {str(ve)}")
        return jsonify({'error': str(ve)}), 404
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Legacy endpoints for backward compatibility
@app.route('/api/tables', methods=['GET'])
def get_all_tables():
    """Get all available tables (legacy endpoint)"""
    try:
        tables = get_available_tables('default')
        return jsonify(tables)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tables/<table_name>/info', methods=['GET'])
def get_table_info_legacy(table_name):
    """Get table information (legacy endpoint)"""
    try:
        info = get_table_info(table_name, 'default')
        return jsonify(info)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/<table_name>', methods=['GET'])
def get_table_data_legacy(table_name):
    """Get table data (legacy endpoint)"""
    try:
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        search = request.args.get('search', '')
        
        columns, rows = fetch_table_data(table_name, 'default', limit=limit, offset=offset, search=search)
        
        return jsonify({
            'columns': columns,
            'rows': rows,
            'metadata': {
                'table_name': table_name,
                'limit': limit,
                'offset': offset,
                'total_rows': len(rows),
                'has_more': len(rows) == limit
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000) 