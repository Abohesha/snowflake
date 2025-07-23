import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Badge,
  Breadcrumbs,
  Link,
  Tooltip,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Fab,
} from '@mui/material';
import {
  Search as SearchIcon,
  TableChart as TableIcon,
  Refresh as RefreshIcon,
  Cloud as CloudIcon,
  List as ListIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Storage as StorageIcon,
  Storage as DatabaseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Settings as SettingsIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  ViewList as ViewListIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import DataTable from './DataTable';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

const SnowflakeDataViewer = () => {
  const [tableName, setTableName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tableData, setTableData] = useState(null);
  const [recentTables, setRecentTables] = useState([]);
  const [availableTables, setAvailableTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [tableInfo, setTableInfo] = useState(null);
  const [showTableList, setShowTableList] = useState(false);
  const [showTableInfo, setShowTableInfo] = useState(false);
  
  // Multi-database state
  const [selectedDatabase, setSelectedDatabase] = useState('default');
  const [selectedSchema, setSelectedSchema] = useState('');
  const [databases, setDatabases] = useState([]);
  const [schemas, setSchemas] = useState([]);
  const [databasesInfo, setDatabasesInfo] = useState([]);
  const [loadingDatabases, setLoadingDatabases] = useState(false);
  const [databaseConnections, setDatabaseConnections] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [showDatabaseInfo, setShowDatabaseInfo] = useState(false);

  // Load available databases on component mount
  useEffect(() => {
    loadDatabases();
  }, []);

  // Load schemas when database changes
  useEffect(() => {
    if (selectedDatabase) {
      loadSchemas();
      setSelectedSchema(''); // Reset schema selection
    }
  }, [selectedDatabase]);

  // Load tables when schema changes
  useEffect(() => {
    if (selectedDatabase && selectedSchema) {
      loadAvailableTables();
    }
  }, [selectedDatabase, selectedSchema]);

  const loadDatabases = async () => {
    setLoadingDatabases(true);
    try {
      const response = await fetch(`${API_BASE_URL}/databases`);
      if (response.ok) {
        const data = await response.json();
        setDatabases(data.databases || []);
        
        // Test connections for all databases
        testAllDatabaseConnections(data.databases || []);
      }
    } catch (err) {
      console.error('Error loading databases:', err);
    } finally {
      setLoadingDatabases(false);
    }
  };

  const loadSchemas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/databases/${selectedDatabase}/schemas`);
      if (response.ok) {
        const data = await response.json();
        setSchemas(data.schemas || []);
        
        // Auto-select first schema if available
        if (data.schemas && data.schemas.length > 0 && !selectedSchema) {
          setSelectedSchema(data.schemas[0].name);
        }
      }
    } catch (err) {
      console.error('Error loading schemas:', err);
      setSchemas([]);
    }
  };

  const testAllDatabaseConnections = async (dbList) => {
    const connections = {};
    for (const db of dbList) {
      try {
        const response = await fetch(`${API_BASE_URL}/databases/${db.key}/test`);
        if (response.ok) {
          const result = await response.json();
          connections[db.key] = result;
        }
      } catch (err) {
        connections[db.key] = { connected: false, error: err.message };
      }
    }
    setDatabaseConnections(connections);
  };

  const loadDatabasesInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/databases/info`);
      if (response.ok) {
        const data = await response.json();
        setDatabasesInfo(data.databases || []);
        setShowDatabaseInfo(true);
      }
    } catch (err) {
      console.error('Error loading databases info:', err);
    }
  };

  const loadAvailableTables = async () => {
    setLoadingTables(true);
    try {
      const response = await fetch(`${API_BASE_URL}/databases/${selectedDatabase}/schemas/${selectedSchema}/tables`);
      if (response.ok) {
        const data = await response.json();
        setAvailableTables(data.tables || []);
      }
    } catch (err) {
      console.error('Error loading tables:', err);
      setAvailableTables([]);
    } finally {
      setLoadingTables(false);
    }
  };

  const loadTableInfo = async (tableName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/databases/${selectedDatabase}/schemas/${selectedSchema}/tables/${tableName}/info`);
      if (response.ok) {
        const info = await response.json();
        setTableInfo(info);
        setShowTableInfo(true);
      }
    } catch (err) {
      console.error('Error loading table info:', err);
    }
  };

  const handleLoadData = async () => {
    if (!tableName.trim()) {
      setError('Please enter a table name');
      return;
    }

    if (!selectedSchema) {
      setError('Please select a schema');
      return;
    }

    // Basic validation
    if (!/^[a-zA-Z0-9_]+$/.test(tableName.trim())) {
      setError('Table name can only contain letters, numbers, and underscores');
      return;
    }

    setLoading(true);
    setError('');
    setTableData(null);

    try {
      const response = await fetch(`${API_BASE_URL}/databases/${selectedDatabase}/schemas/${selectedSchema}/data/${tableName.trim()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const rawData = await response.json();
      
      console.log('Raw data from API:', rawData);
      
      // The API already returns the correct format, no transformation needed
      if (rawData.rows && rawData.columns) {
        setTableData({
          columns: rawData.columns,
          rows: rawData.rows
        });
      } else {
        setTableData({ columns: [], rows: [] });
      }
      
      // Add to recent tables with database and schema context
      const tableKey = `${selectedDatabase}:${selectedSchema}:${tableName.trim().toUpperCase()}`;
      if (!recentTables.includes(tableKey)) {
        setRecentTables(prev => [tableKey, ...prev.slice(0, 4)]);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load table data');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleLoadData();
    }
  };

  const handleRecentTableClick = (tableKey) => {
    const [dbKey, schemaName, tableName] = tableKey.split(':');
    setSelectedDatabase(dbKey);
    setSelectedSchema(schemaName);
    setTableName(tableName);
    // Auto-load the table
    setTimeout(() => handleLoadData(), 100);
  };

  const handleTableClick = (table) => {
    setTableName(table.name);
    setShowTableList(false);
    // Auto-load the table
    setTimeout(() => handleLoadData(), 100);
  };

  const handleRefresh = () => {
    if (tableName.trim() && selectedSchema) {
      handleLoadData();
    }
    loadAvailableTables();
    loadDatabasesInfo();
  };

  const handleClear = () => {
    setTableName('');
    setTableData(null);
    setError('');
  };

  const formatBytes = (bytes) => {
    if (bytes === null || bytes === undefined) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getConnectionStatus = (dbKey) => {
    const connection = databaseConnections[dbKey];
    if (!connection) return { connected: false, icon: <ErrorIcon color="error" /> };
    return {
      connected: connection.connected,
      icon: connection.connected ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />
    };
  };

  const getCurrentDatabase = () => {
    return databases.find(db => db.key === selectedDatabase);
  };

  const getCurrentSchema = () => {
    return schemas.find(schema => schema.name === selectedSchema);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Paper elevation={3} sx={{ p: 4, mb: 4, textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
          <CloudIcon sx={{ fontSize: 40, mr: 2 }} />
          <Typography variant="h3" component="h1" fontWeight="bold">
            Snowflake Data Explorer
          </Typography>
        </Box>
        <Typography variant="h6" color="rgba(255,255,255,0.9)">
          Explore your Snowflake databases, schemas, and tables with ease
        </Typography>
      </Paper>

      {/* Breadcrumb Navigation */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
          <Link color="inherit" href="#" onClick={() => setSelectedDatabase('default')}>
            <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
            Databases
          </Link>
          {selectedDatabase && (
            <Link color="inherit" href="#">
              {getCurrentDatabase()?.name || selectedDatabase}
            </Link>
          )}
          {selectedSchema && (
            <Typography color="text.primary">{selectedSchema}</Typography>
          )}
        </Breadcrumbs>
      </Paper>

      {/* Database and Schema Selection */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <DatabaseIcon color="primary" />
          <Typography variant="h6">Database & Schema Selection</Typography>
        </Box>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Select Database</InputLabel>
              <Select
                value={selectedDatabase}
                onChange={(e) => setSelectedDatabase(e.target.value)}
                label="Select Database"
              >
                {databases.map((db) => {
                  const status = getConnectionStatus(db.key);
                  return (
                    <MenuItem key={db.key} value={db.key}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {status.icon}
                        <Typography>{db.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({db.database})
                        </Typography>
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth disabled={!selectedDatabase || schemas.length === 0}>
              <InputLabel>Select Schema</InputLabel>
              <Select
                value={selectedSchema}
                onChange={(e) => setSelectedSchema(e.target.value)}
                label="Select Schema"
              >
                {schemas.map((schema) => (
                  <MenuItem key={schema.name} value={schema.name}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <StorageIcon fontSize="small" />
                      <Typography>{schema.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({schema.owner})
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Input Section */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardHeader 
              title="Load Table Data" 
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              avatar={<TableIcon color="primary" />}
              action={
                <IconButton onClick={() => setShowTableList(true)}>
                  <ListIcon />
                </IconButton>
              }
            />
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Table Name"
                  variant="outlined"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., CUSTOMERS, ORDERS"
                  disabled={loading || !selectedSchema}
                  sx={{ mb: 2 }}
                />
                
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleLoadData}
                  disabled={loading || !tableName.trim() || !selectedSchema}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                  sx={{ mb: 2 }}
                >
                  {loading ? 'Loading...' : 'Load Data'}
                </Button>

                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="medium"
                      onClick={handleRefresh}
                      disabled={loading}
                      startIcon={<RefreshIcon />}
                    >
                      Refresh
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="medium"
                      onClick={handleClear}
                      disabled={loading}
                      startIcon={<ClearIcon />}
                    >
                      Clear
                    </Button>
                  </Grid>
                </Grid>

                {tableName && selectedSchema && (
                  <Button
                    fullWidth
                    variant="text"
                    size="small"
                    onClick={() => loadTableInfo(tableName)}
                    startIcon={<InfoIcon />}
                    sx={{ mt: 2 }}
                  >
                    Table Info
                  </Button>
                )}
              </Box>

              {/* Quick Actions */}
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Quick Actions:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {['CUSTOMERS', 'ORDERS', 'PRODUCTS'].map((table) => (
                  <Chip
                    key={table}
                    label={table}
                    clickable
                    onClick={() => handleRecentTableClick(`${selectedDatabase}:${selectedSchema}:${table}`)}
                    variant="outlined"
                    size="small"
                    disabled={!selectedSchema}
                  />
                ))}
              </Box>

              {/* Recent Tables */}
              {recentTables.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Recent Tables:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {recentTables.map((tableKey) => {
                      const [dbKey, schemaName, tableName] = tableKey.split(':');
                      return (
                        <Chip
                          key={tableKey}
                          label={`${tableName} (${dbKey}.${schemaName})`}
                          clickable
                          onClick={() => handleRecentTableClick(tableKey)}
                          variant="filled"
                          color="primary"
                          size="small"
                        />
                      );
                    })}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Data Display Section */}
        <Grid item xs={12} md={8}>
          <Card elevation={3}>
            <CardHeader 
              title={`Table Data - ${selectedDatabase.toUpperCase()}.${selectedSchema.toUpperCase()}`}
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              action={
                tableData && (
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Chip 
                      label={`${tableData.rows.length} rows`} 
                      color="primary" 
                      variant="outlined" 
                      size="small" 
                    />
                    <Chip 
                      label={`${tableData.columns.length} columns`} 
                      color="secondary" 
                      variant="outlined" 
                      size="small" 
                    />
                  </Box>
                )
              }
            />
            <CardContent>
              {/* Error Message */}
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {/* Loading State */}
              {loading && (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                  <Box textAlign="center">
                    <CircularProgress size={60} />
                    <Typography variant="h6" sx={{ mt: 2 }}>
                      Connecting to Snowflake...
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Loading table data from {selectedDatabase}.{selectedSchema}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Table Data */}
              {tableData && !loading && (
                <DataTable data={tableData} tableName={tableName} />
              )}

              {/* Empty State */}
              {!tableData && !loading && !error && (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                  <Box textAlign="center">
                    <TableIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No data loaded
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Select a database, schema, and enter a table name to view data
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Speed Dial for Quick Actions */}
      <SpeedDial
        ariaLabel="Quick actions"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<DashboardIcon />}
          tooltipTitle="Database Info"
          onClick={loadDatabasesInfo}
        />
        <SpeedDialAction
          icon={<ViewListIcon />}
          tooltipTitle="Table List"
          onClick={() => setShowTableList(true)}
        />
        <SpeedDialAction
          icon={<RefreshIcon />}
          tooltipTitle="Refresh All"
          onClick={handleRefresh}
        />
      </SpeedDial>

      {/* Table List Dialog */}
      <Dialog 
        open={showTableList} 
        onClose={() => setShowTableList(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <StorageIcon />
            Available Tables in {selectedDatabase.toUpperCase()}.{selectedSchema.toUpperCase()} ({availableTables.length})
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingTables ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {availableTables.map((table) => (
                <ListItem 
                  key={table.name}
                  button
                  onClick={() => handleTableClick(table)}
                  sx={{ borderBottom: '1px solid #f0f0f0' }}
                >
                  <ListItemText
                    primary={table.name}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Rows: {table.row_count?.toLocaleString() || 'Unknown'} | 
                          Size: {formatBytes(table.size_bytes)} |
                          Created: {table.created ? new Date(table.created).toLocaleDateString() : 'Unknown'}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton onClick={() => loadTableInfo(table.name)}>
                      <InfoIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTableList(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Table Info Dialog */}
      <Dialog 
        open={showTableInfo} 
        onClose={() => setShowTableInfo(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Table Information</DialogTitle>
        <DialogContent>
          {tableInfo && (
            <Box>
              <Typography variant="h6" gutterBottom>{tableInfo.table_name}</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Database: {tableInfo.database} | Schema: {tableInfo.schema}
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Row Count</Typography>
                  <Typography variant="body1">{tableInfo.row_count?.toLocaleString() || 'Unknown'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Size</Typography>
                  <Typography variant="body1">{formatBytes(tableInfo.size_bytes)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Columns</Typography>
                  <Typography variant="body1">{tableInfo.column_count}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Created</Typography>
                  <Typography variant="body1">
                    {tableInfo.created ? new Date(tableInfo.created).toLocaleDateString() : 'Unknown'}
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>Columns</Typography>
              {tableInfo.columns?.map((column) => (
                <Accordion key={column.name}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">{column.name}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Data Type</Typography>
                        <Typography variant="body1">{column.data_type}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Nullable</Typography>
                        <Typography variant="body1">{column.nullable ? 'Yes' : 'No'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Position</Typography>
                        <Typography variant="body1">{column.position}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Default</Typography>
                        <Typography variant="body1">{column.default_value || 'None'}</Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTableInfo(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Database Info Dialog */}
      <Dialog 
        open={showDatabaseInfo} 
        onClose={() => setShowDatabaseInfo(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Database Information</DialogTitle>
        <DialogContent>
          {databasesInfo.map((db) => (
            <Accordion key={db.key}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={2}>
                  {getConnectionStatus(db.key).icon}
                  <Typography variant="h6">{db.name}</Typography>
                  <Chip label={`${db.schema_count} schemas`} size="small" />
                  <Chip label={`${db.table_count} tables`} size="small" />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Database: {db.database}
                </Typography>
                {db.schemas?.map((schema) => (
                  <Box key={schema.name} sx={{ ml: 2, mb: 1 }}>
                    <Typography variant="subtitle2">
                      {schema.name} (Owner: {schema.owner})
                    </Typography>
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDatabaseInfo(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SnowflakeDataViewer; 