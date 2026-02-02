import React, { useState, useEffect } from 'react';
import { CircleStackIcon, ServerIcon } from '@heroicons/react/24/outline';
import TableList from './TableList';
import TableViewer from './TableViewer';

const DatabaseViewer = ({ directory, databaseType, onChangeDirectory, isSelecting, onQuit }) => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [databaseInfo, setDatabaseInfo] = useState(null);

  useEffect(() => {
    const loadDatabaseInfo = async () => {
      try {
        const info = await window.electronAPI.getDatabaseInfo(directory, databaseType);
        setDatabaseInfo(info);
        
        const tableList = await window.electronAPI.getTables(directory, databaseType);
        setTables(tableList);
      } catch (error) {
        console.error('Error loading database info:', error);
      }
    };

    loadDatabaseInfo();
  }, [directory, databaseType]);

  return (
    <div className="flex-1 flex flex-col p-6 pt-0 overflow-hidden">
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 flex-none">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <p className="font-medium text-gray-700">WordPress Directory</p>
              {databaseType === 'sqlite' ? (
                <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <CircleStackIcon className="w-4 h-4" />
                  SQLite
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <ServerIcon className="w-4 h-4" />
                  MySQL
                </span>
              )}
            </div>
            <p className="bg-white px-4 py-2.5 rounded-md border border-gray-200 font-mono text-sm text-gray-600 break-all">
              {directory}
            </p>
            {databaseInfo && (
              <p className="text-sm text-gray-600 mt-2">
                {databaseInfo.tableCount} tables
              </p>
            )}
          </div>
          <button
            onClick={onChangeDirectory}
            disabled={isSelecting}
            className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg disabled:opacity-50 whitespace-nowrap transition-colors duration-200 shadow-sm h-[42px]"
          >
            {isSelecting ? 'Selecting...' : 'Change Directory'}
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex gap-6 mt-6 min-h-0">
        <div className="w-64 flex-none">
          <TableList 
            tables={tables}
            selectedTable={selectedTable}
            onSelectTable={setSelectedTable}
          />
        </div>
        
        <div className="flex-1 flex flex-col min-w-0">
          {selectedTable ? (
            <TableViewer 
              directory={directory}
              tableName={selectedTable}
              databaseType={databaseType}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500 italic">Select a table to view its data</p>
            </div>
          )}
          
          <div className="mt-4 text-right flex-none">
            <button
              onClick={onQuit}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200 shadow-sm"
            >
              Quit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseViewer;
