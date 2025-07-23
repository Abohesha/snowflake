import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TextField,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Button,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';

const DataTable = ({ data, tableName }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [hiddenColumns, setHiddenColumns] = useState(new Set());
  const [filterColumn, setFilterColumn] = useState('all');

  // Memoized filtered and sorted data
  const processedData = useMemo(() => {
    let filteredData = data.rows || [];

    // Apply search filter
    if (searchTerm) {
      filteredData = filteredData.filter(row => {
        if (filterColumn === 'all') {
          return Object.values(row).some(value => 
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
          );
        } else {
          const cellValue = row[filterColumn];
          return String(cellValue).toLowerCase().includes(searchTerm.toLowerCase());
        }
      });
    }

    // Apply sorting
    if (sortColumn) {
      filteredData.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        // Handle null/undefined values
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return sortDirection === 'asc' ? -1 : 1;
        if (bVal == null) return sortDirection === 'asc' ? 1 : -1;
        
        // Handle numeric values
        if (!isNaN(aVal) && !isNaN(bVal)) {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        // Handle string values
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        return sortDirection === 'asc' 
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }

    return filteredData;
  }, [data.rows, searchTerm, sortColumn, sortDirection, filterColumn]);

  // Get visible columns
  const visibleColumns = useMemo(() => {
    return data.columns?.filter(col => !hiddenColumns.has(col)) || [];
  }, [data.columns, hiddenColumns]);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const toggleColumnVisibility = (column) => {
    const newHidden = new Set(hiddenColumns);
    if (newHidden.has(column)) {
      newHidden.delete(column);
    } else {
      newHidden.add(column);
    }
    setHiddenColumns(newHidden);
  };

  const handleExportCSV = () => {
    if (!data.rows || data.rows.length === 0) return;

    const headers = visibleColumns.join(',');
    const csvContent = [
      headers,
      ...data.rows.map(row => 
        visibleColumns.map(col => {
          const value = row[col];
          if (value === null || value === undefined) return '';
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName || 'data'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCellValue = (value) => {
    if (value === null || value === undefined) {
      return <Typography variant="body2" color="text.secondary" fontStyle="italic">null</Typography>;
    }
    
    if (typeof value === 'boolean') {
      return (
        <Chip 
          label={value ? 'True' : 'False'} 
          color={value ? 'success' : 'error'} 
          size="small" 
          variant="outlined"
        />
      );
    }
    
    if (typeof value === 'number') {
      return <Typography variant="body2" fontFamily="monospace">{value.toLocaleString()}</Typography>;
    }
    
    if (typeof value === 'string') {
      // Check if it's a date
      const dateValue = new Date(value);
      if (!isNaN(dateValue.getTime())) {
        return <Typography variant="body2">{dateValue.toLocaleString()}</Typography>;
      }
      
      // Check if it's a long string
      if (value.length > 50) {
        return (
          <Tooltip title={value}>
            <Typography variant="body2" noWrap>
              {value.substring(0, 50)}...
            </Typography>
          </Tooltip>
        );
      }
    }
    
    return <Typography variant="body2">{String(value)}</Typography>;
  };

  const getColumnType = (columnName) => {
    if (!data.rows || data.rows.length === 0) return 'string';
    
    const sampleValue = data.rows[0][columnName];
    if (typeof sampleValue === 'number') return 'number';
    if (typeof sampleValue === 'boolean') return 'boolean';
    
    // Check if it's a date
    if (typeof sampleValue === 'string') {
      const dateValue = new Date(sampleValue);
      if (!isNaN(dateValue.getTime())) return 'date';
    }
    
    return 'string';
  };

  if (!data || !data.columns || data.columns.length === 0) {
    return (
      <Alert severity="info">
        No data available to display.
      </Alert>
    );
  }

  return (
    <Card elevation={2}>
      <CardContent>
        {/* Table Header with Controls */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                {tableName} - {processedData.length} rows
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" gap={1} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportCSV}
                >
                  Export CSV
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FilterIcon />}
                  onClick={() => setHiddenColumns(new Set())}
                >
                  Show All Columns
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Search and Filter Controls */}
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search in data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>All Columns</InputLabel>
                <Select
                  value={filterColumn}
                  onChange={(e) => setFilterColumn(e.target.value)}
                  label="All Columns"
                >
                  <MenuItem value="all">All Columns</MenuItem>
                  {data.columns?.map((column) => (
                    <MenuItem key={column} value={column}>
                      {column}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Column Visibility Chips */}
        {data.columns && data.columns.length > 0 && (
          <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {data.columns.map((column) => (
              <Chip
                key={column}
                label={column}
                size="small"
                variant={hiddenColumns.has(column) ? "outlined" : "filled"}
                color={hiddenColumns.has(column) ? "default" : "primary"}
                onClick={() => toggleColumnVisibility(column)}
                onDelete={hiddenColumns.has(column) ? undefined : () => toggleColumnVisibility(column)}
                deleteIcon={hiddenColumns.has(column) ? <VisibilityOffIcon /> : <VisibilityIcon />}
                icon={hiddenColumns.has(column) ? <VisibilityOffIcon /> : undefined}
              />
            ))}
          </Box>
        )}

        {/* Data Table */}
        <TableContainer component={Paper} elevation={1}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {visibleColumns.map((column) => (
                  <TableCell
                    key={column}
                    onClick={() => handleSort(column)}
                    sx={{
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      {column}
                      {sortColumn === column && (
                        <SortIcon
                          sx={{
                            transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none',
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {processedData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => (
                  <TableRow key={index} hover>
                    {visibleColumns.map((column) => (
                      <TableCell key={column}>
                        {formatCellValue(row[column])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={processedData.length}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </CardContent>
    </Card>
  );
};

export default DataTable; 