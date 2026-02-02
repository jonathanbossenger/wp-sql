const { app, BrowserWindow, ipcMain, dialog, Notification, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { hasValidMySQLConfig } = require('./wp-config-parser');
const { createDatabaseAdapter } = require('./database-abstraction');

let mainWindow = null;
let store = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Initialize electron store
const initStore = async () => {
  const { default: Store } = await import('electron-store');
  store = new Store({
    defaults: {
      recentDirectories: [],
      databaseTypes: {}
    }
  });
};

// Function to add a directory to recent list
const addToRecentDirectories = (directory) => {
  if (!store) return [];
  const recentDirectories = store.get('recentDirectories', []);
  const filteredDirectories = recentDirectories.filter(dir => dir !== directory);
  filteredDirectories.unshift(directory);
  const updatedDirectories = filteredDirectories.slice(0, 5);
  store.set('recentDirectories', updatedDirectories);
  return updatedDirectories;
};

// Function to check if directory has SQLite database
const hasSQLiteDatabase = async (directory) => {
  try {
    const dbPath = path.join(directory, 'wp-content', 'database', '.ht.sqlite');
    await fs.promises.access(dbPath);
    return true;
  } catch (error) {
    return false;
  }
};

// Function to detect available database types
const detectDatabaseTypes = async (directory) => {
  const types = [];
  
  if (await hasSQLiteDatabase(directory)) {
    types.push('sqlite');
  }
  
  if (hasValidMySQLConfig(directory)) {
    types.push('mysql');
  }
  
  return types;
};

// Function to check if directory is a valid WordPress installation
const isWordPressDirectory = async (directory) => {
  const types = await detectDatabaseTypes(directory);
  return types.length > 0;
};

// Function to get SQLite database path
const getDatabasePath = (directory) => {
  return path.join(directory, 'wp-content', 'database', '.ht.sqlite');
};

// Function to filter out hidden tables (those starting with underscore)
const filterHiddenTables = (tables) => {
  return tables.filter(t => !t.name.startsWith('_'));
};

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    title: 'WP SQL',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, '..', 'preload.js'),
    },
  });

  // Load the index.html file.
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  // Open the DevTools in development.
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
};

const createMenu = () => {
  const template = [
    {
      label: 'WP SQL',
      submenu: [
        {
          label: 'About WP SQL',
          click: () => {
            const aboutWindow = new BrowserWindow({
              width: 300,
              height: 340,
              title: 'About WP SQL',
              resizable: false,
              minimizable: false,
              maximizable: false,
              fullscreenable: false,
              webPreferences: {
                nodeIntegration: true,
                contextIsolation: true,
                preload: path.join(__dirname, '..', 'preload.js'),
              }
            });

            aboutWindow.loadFile(path.join(__dirname, '..', 'renderer', 'about.html'));
            
            // Open dev tools immediately in development mode
            if (process.env.NODE_ENV === 'development') {
              aboutWindow.webContents.openDevTools({ mode: 'detach' });
            }

            aboutWindow.once('ready-to-show', () => {
              aboutWindow.show();
            });
          }
        },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { 
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Alt+F4',
          click: async () => {
            app.isQuitting = true;
            app.quit();
          }
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

// Handle directory selection
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Select WordPress Installation Directory',
  });
  
  if (!result.canceled) {
    const directory = result.filePaths[0];
    // Verify it's a WordPress directory
    if (await isWordPressDirectory(directory)) {
      addToRecentDirectories(directory);
      return directory;
    } else {
      throw new Error('Selected directory is not a WordPress installation (no database found)');
    }
  }
  return null;
});

// Get recent directories
ipcMain.handle('get-recent-directories', async () => {
  if (!store) return [];
  return store.get('recentDirectories', []);
});

// Handle selecting a recent directory
ipcMain.handle('select-recent-directory', async (event, directory) => {
  if (await isWordPressDirectory(directory)) {
    addToRecentDirectories(directory);
    return directory;
  } else {
    if (store) {
      const recentDirectories = store.get('recentDirectories', []);
      const filteredDirectories = recentDirectories.filter(dir => dir !== directory);
      store.set('recentDirectories', filteredDirectories);
    }
    throw new Error('Selected directory is no longer a valid WordPress installation');
  }
});

// Get available database types for a directory
ipcMain.handle('get-database-types', async (event, wpDirectory) => {
  try {
    return await detectDatabaseTypes(wpDirectory);
  } catch (error) {
    console.error('Error detecting database types:', error);
    throw error;
  }
});

// Select database type for a directory
ipcMain.handle('select-database-type', async (event, wpDirectory, databaseType) => {
  if (!store) return;
  const databaseTypes = store.get('databaseTypes', {});
  databaseTypes[wpDirectory] = databaseType;
  store.set('databaseTypes', databaseTypes);
});

// Get selected database type for a directory
ipcMain.handle('get-selected-database-type', async (event, wpDirectory) => {
  if (!store) return null;
  const databaseTypes = store.get('databaseTypes', {});
  return databaseTypes[wpDirectory] || null;
});

// Get database info
ipcMain.handle('get-database-info', async (event, wpDirectory, databaseType) => {
  const dbPath = getDatabasePath(wpDirectory);
  const adapter = createDatabaseAdapter(wpDirectory, databaseType, dbPath);
  
  try {
    await adapter.connect();
    const tables = await adapter.getTables();
    await adapter.disconnect();
    
    return {
      path: databaseType === 'sqlite' ? dbPath : 'MySQL Database',
      tableCount: tables.length,
      databaseType: databaseType
    };
  } catch (error) {
    console.error('Error getting database info:', error);
    await adapter.disconnect();
    throw error;
  }
});

// Get list of tables
ipcMain.handle('get-tables', async (event, wpDirectory, databaseType) => {
  const dbPath = getDatabasePath(wpDirectory);
  const adapter = createDatabaseAdapter(wpDirectory, databaseType, dbPath);
  
  try {
    await adapter.connect();
    const tables = await adapter.getTables();
    await adapter.disconnect();
    return tables;
  } catch (error) {
    console.error('Error getting tables:', error);
    await adapter.disconnect();
    throw error;
  }
});

// Get table data with pagination
ipcMain.handle('get-table-data', async (event, wpDirectory, tableName, offset = 0, limit = 50, databaseType) => {
  const dbPath = getDatabasePath(wpDirectory);
  const adapter = createDatabaseAdapter(wpDirectory, databaseType, dbPath);
  
  try {
    await adapter.connect();
    
    // Get table schema
    const schema = await adapter.getTableSchema(tableName);
    
    // Get data
    const data = await adapter.getTableData(tableName, offset, limit);
    
    await adapter.disconnect();
    
    return {
      schema: schema,
      data: data,
      columns: schema.map(col => col.name)
    };
  } catch (error) {
    console.error('Error getting table data:', error);
    await adapter.disconnect();
    throw error;
  }
});

// Get table row count
ipcMain.handle('get-table-row-count', async (event, wpDirectory, tableName, databaseType) => {
  const dbPath = getDatabasePath(wpDirectory);
  const adapter = createDatabaseAdapter(wpDirectory, databaseType, dbPath);
  
  try {
    await adapter.connect();
    const count = await adapter.getRowCount(tableName);
    await adapter.disconnect();
    return count;
  } catch (error) {
    console.error('Error getting row count:', error);
    await adapter.disconnect();
    throw error;
  }
});

// Execute custom query
ipcMain.handle('execute-query', async (event, wpDirectory, query, databaseType) => {
  const dbPath = getDatabasePath(wpDirectory);
  const adapter = createDatabaseAdapter(wpDirectory, databaseType, dbPath);
  
  try {
    await adapter.connect();
    const result = await adapter.executeQuery(query);
    await adapter.disconnect();
    return result;
  } catch (error) {
    console.error('Error executing query:', error);
    await adapter.disconnect();
    throw error;
  }
});

// Update row
ipcMain.handle('update-row', async (event, wpDirectory, tableName, rowId, data, databaseType) => {
  const dbPath = getDatabasePath(wpDirectory);
  const adapter = createDatabaseAdapter(wpDirectory, databaseType, dbPath);
  
  try {
    await adapter.connect();
    
    // Get primary key column
    const schema = await adapter.getTableSchema(tableName);
    const pkColumn = schema.find(col => col.primaryKey);
    
    if (!pkColumn) {
      await adapter.disconnect();
      throw new Error('Table has no primary key');
    }
    
    const result = await adapter.updateRow(tableName, pkColumn.name, rowId, data);
    await adapter.disconnect();
    return result;
  } catch (error) {
    console.error('Error updating row:', error);
    await adapter.disconnect();
    throw error;
  }
});

// Delete row
ipcMain.handle('delete-row', async (event, wpDirectory, tableName, rowId, databaseType) => {
  const dbPath = getDatabasePath(wpDirectory);
  const adapter = createDatabaseAdapter(wpDirectory, databaseType, dbPath);
  
  try {
    await adapter.connect();
    
    // Get primary key column
    const schema = await adapter.getTableSchema(tableName);
    const pkColumn = schema.find(col => col.primaryKey);
    
    if (!pkColumn) {
      await adapter.disconnect();
      throw new Error('Table has no primary key');
    }
    
    const result = await adapter.deleteRow(tableName, pkColumn.name, rowId);
    await adapter.disconnect();
    return result;
  } catch (error) {
    console.error('Error deleting row:', error);
    await adapter.disconnect();
    throw error;
  }
});

// Insert row
ipcMain.handle('insert-row', async (event, wpDirectory, tableName, data, databaseType) => {
  const dbPath = getDatabasePath(wpDirectory);
  const adapter = createDatabaseAdapter(wpDirectory, databaseType, dbPath);
  
  try {
    await adapter.connect();
    const result = await adapter.insertRow(tableName, data);
    await adapter.disconnect();
    return result;
  } catch (error) {
    console.error('Error inserting row:', error);
    await adapter.disconnect();
    throw error;
  }
});

// Handle quitting the app
ipcMain.handle('quit-app', async () => {
  app.isQuitting = true;
  app.quit();
});

app.whenReady().then(async () => {
  await initStore();
  createMenu();
  createWindow();

  // Handle dock icon clicks
  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Handle macOS dock menu
  if (process.platform === 'darwin' && app.dock) {
    const dockMenu = Menu.buildFromTemplate([
      {
        label: 'Show Window',
        click() {
          if (mainWindow === null) {
            createWindow();
          } else {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      }
    ]);
    app.dock.setMenu(dockMenu);
  }
});

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
