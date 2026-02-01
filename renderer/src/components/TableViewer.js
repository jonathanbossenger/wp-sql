import React, { useState, useEffect } from 'react';
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import EditRowModal from './EditRowModal';
import AddRowModal from './AddRowModal';

const TableViewer = ({ directory, tableName, databaseType }) => {
  const [tableData, setTableData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [editingRow, setEditingRow] = useState(null);
  const [addingRow, setAddingRow] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchColumn, setSearchColumn] = useState('all');
  const rowsPerPage = 50;

  useEffect(() => {
    loadTableData();
    loadRowCount();
  }, [directory, tableName, currentPage, databaseType]);

  const loadTableData = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.getTableData(
        directory, 
        tableName, 
        currentPage * rowsPerPage, 
        rowsPerPage,
        databaseType
      );
      setTableData(data);
    } catch (error) {
      console.error('Error loading table data:', error);
    }
    setLoading(false);
  };

  const loadRowCount = async () => {
    try {
      const count = await window.electronAPI.getTableRowCount(directory, tableName, databaseType);
      setTotalRows(count);
    } catch (error) {
      console.error('Error loading row count:', error);
    }
  };

  const handleDeleteRow = async (rowId) => {
    if (!window.confirm('Are you sure you want to delete this row?')) {
      return;
    }
    
    try {
      await window.electronAPI.deleteRow(directory, tableName, rowId, databaseType);
      await loadTableData();
      await loadRowCount();
    } catch (error) {
      console.error('Error deleting row:', error);
      alert('Error deleting row: ' + error.message);
    }
  };

  const handleEditRow = (row) => {
    setEditingRow(row);
  };

  const handleSaveRow = async (rowId, data) => {
    try {
      await window.electronAPI.updateRow(directory, tableName, rowId, data, databaseType);
      setEditingRow(null);
      await loadTableData();
    } catch (error) {
      console.error('Error updating row:', error);
      alert('Error updating row: ' + error.message);
    }
  };

  const handleAddRow = async (data) => {
    try {
      await window.electronAPI.insertRow(directory, tableName, data, databaseType);
      setAddingRow(false);
      await loadTableData();
      await loadRowCount();
    } catch (error) {
      console.error('Error adding row:', error);
      alert('Error adding row: ' + error.message);
    }
  };

  if (loading && !tableData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!tableData) {
    return null;
  }

  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const pkColumn = tableData.schema.find(col => col.primaryKey === true);

  // Filter data based on search query and selected column
  const filteredData = tableData.data.filter(row => {
    if (!searchQuery.trim()) return true;
    
    // Search all columns
    if (searchColumn === 'all') {
      return Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Search specific column
    const columnValue = row[searchColumn];
    if (columnValue === null || columnValue === undefined) {
      return false;
    }
    return String(columnValue).toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex-1 flex flex-col bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{tableName}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {totalRows} rows total, showing {currentPage * rowsPerPage + 1} - {Math.min((currentPage + 1) * rowsPerPage, totalRows)}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={searchColumn}
            onChange={(e) => setSearchColumn(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
          >
            <option value="all">All Columns</option>
            {tableData.columns?.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <button
            onClick={() => setAddingRow(true)}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
            title="Add new row"
          >
            <PlusIcon className="h-5 w-5" />
            Add Row
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto table-scroll">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">
                Actions
              </th>
              {tableData.columns.map((column) => (
                <th key={column} className="px-4 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">
                  {column}
                  {tableData.schema.find(col => col.name === column)?.primaryKey === true && (
                    <span className="ml-1 text-xs text-blue-600">(PK)</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, index) => {
              const rowId = pkColumn ? row[pkColumn.name] : index;
              return (
                <tr key={rowId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 border-b border-gray-200">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditRow(row)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      {pkColumn && (
                        <button
                          onClick={() => handleDeleteRow(rowId)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                  {tableData.columns.map((column) => (
                    <td key={column} className="px-4 py-2 border-b border-gray-200 max-w-xs truncate">
                      {row[column] !== null ? String(row[column]) : <span className="text-gray-400 italic">NULL</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t border-gray-200 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Page {currentPage + 1} of {totalPages || 1}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm transition-colors duration-200"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm transition-colors duration-200"
          >
            Next
          </button>
        </div>
      </div>

      {editingRow && pkColumn && (
        <EditRowModal
          row={editingRow}
          columns={tableData.columns}
          schema={tableData.schema}
          pkColumn={pkColumn}
          onSave={handleSaveRow}
          onClose={() => setEditingRow(null)}
        />
      )}

      {addingRow && (
        <AddRowModal
          columns={tableData.columns}
          schema={tableData.schema}
          pkColumn={pkColumn}
          onSave={handleAddRow}
          onClose={() => setAddingRow(false)}
        />
      )}
    </div>
  );
};

export default TableViewer;
