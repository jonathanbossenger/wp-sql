const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getDatabaseInfo: (directory, databaseType) => ipcRenderer.invoke('get-database-info', directory, databaseType),
  getTables: (directory, databaseType) => ipcRenderer.invoke('get-tables', directory, databaseType),
  getTableData: (directory, tableName, offset, limit, databaseType) => ipcRenderer.invoke('get-table-data', directory, tableName, offset, limit, databaseType),
  getTableRowCount: (directory, tableName, databaseType) => ipcRenderer.invoke('get-table-row-count', directory, tableName, databaseType),
  executeQuery: (directory, query, databaseType) => ipcRenderer.invoke('execute-query', directory, query, databaseType),
  updateRow: (directory, tableName, rowId, data, databaseType) => ipcRenderer.invoke('update-row', directory, tableName, rowId, data, databaseType),
  deleteRow: (directory, tableName, rowId, databaseType) => ipcRenderer.invoke('delete-row', directory, tableName, rowId, databaseType),
  insertRow: (directory, tableName, data, databaseType) => ipcRenderer.invoke('insert-row', directory, tableName, data, databaseType),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  getRecentDirectories: () => ipcRenderer.invoke('get-recent-directories'),
  selectRecentDirectory: (directory) => ipcRenderer.invoke('select-recent-directory', directory),
  getDatabaseTypes: (directory) => ipcRenderer.invoke('get-database-types', directory),
  selectDatabaseType: (directory, databaseType) => ipcRenderer.invoke('select-database-type', directory, databaseType),
  getSelectedDatabaseType: (directory) => ipcRenderer.invoke('get-selected-database-type', directory),
  openExternal: (url) => shell.openExternal(url)
});
