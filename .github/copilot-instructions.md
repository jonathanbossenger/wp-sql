# GitHub Copilot Instructions for WP SQLite

## Project Overview

WP SQLite is a desktop application for viewing and editing databases in WordPress installations. It supports both SQLite (WordPress Studio) and MySQL (traditional WordPress) databases. Built with Electron and React, providing a user-friendly interface for database management.

WordPress Studio is a desktop application for local WordPress development. For more information, see the [Studio GitHub repository](https://github.com/Automattic/studio/).

## Technology Stack

- **Electron**: Desktop application framework (main and renderer processes)
- **React**: UI library for the renderer process
- **Tailwind CSS**: Utility-first CSS framework for styling
- **better-sqlite3**: SQLite3 bindings for Node.js
- **mysql2**: MySQL client for Node.js with promise support
- **Webpack**: Module bundler for the renderer process
- **Electron Forge**: Build and packaging tool

## Project Structure

```
wp-sqlite/
├── main/
│   ├── index.js                 # Main Electron process with IPC handlers
│   ├── database-abstraction.js  # Database adapter layer (SQLite & MySQL)
│   └── wp-config-parser.js      # wp-config.php parser for MySQL credentials
├── renderer/
│   ├── src/
│   │   ├── App.js               # Main React component with database type selection
│   │   ├── components/          # React components (AddRowModal, DatabaseTypeSelector,
│   │   │                        # DatabaseViewer, EditRowModal, RecentDirectories, 
│   │   │                        # TableList, TableViewer)
│   │   ├── index.js             # React entry point
│   │   └── styles.css           # Tailwind CSS styles
│   ├── index.html               # HTML template
│   └── about.html               # About window
├── scripts/
│   └── generate-app-icons.js    # Icon generation script
├── preload.js                   # Electron preload script (security bridge)
├── webpack.config.js            # Webpack configuration
├── forge.config.js              # Electron Forge configuration
└── MYSQL-SUPPORT.md             # MySQL implementation documentation
```

## Architecture and Patterns

### Electron IPC Communication

The app uses Electron's IPC (Inter-Process Communication) for secure communication between main and renderer processes:

- **Main Process** (`main/index.js`): Handles IPC requests, database operations, file system access
- **Renderer Process** (`renderer/src/`): React UI that makes IPC calls via `window.electronAPI`
- **Preload Script** (`preload.js`): Exposes secure API via `contextBridge`

**Important:** Always use IPC for database operations. Never directly access SQLite from the renderer process.

### IPC Handlers

Main process handlers available:
- `select-directory`: Directory picker for WordPress installations
- `get-database-types`: Returns available database types for a directory (['sqlite'], ['mysql'], or ['sqlite', 'mysql'])
- `select-database-type`: Sets the active database type for a directory
- `get-selected-database-type`: Gets the previously selected database type
- `get-database-info`: Database path and table count (requires databaseType parameter)
- `get-tables`: List all tables (filters out hidden tables starting with `_`, requires databaseType)
- `get-table-data`: Paginated table data (requires databaseType)
- `get-table-row-count`: Total row count (requires databaseType)
- `execute-query`: Custom SQL query execution (requires databaseType)
- `update-row`, `delete-row`, `insert-row`: CRUD operations (require databaseType)
- `get-recent-directories`, `select-recent-directory`: Recent directory management
- `quit-app`: Safely quit the application
- `openExternal`: Open URLs in default browser (via shell.openExternal)

**Note:** All database operation handlers now require a `databaseType` parameter ('sqlite' or 'mysql').

### React Component Patterns

- **Functional Components**: Use functional components with hooks
- **State Management**: Use React's `useState` and `useEffect` hooks
- **Props**: Pass data and callbacks via props
- **Event Handlers**: Prefix handler functions with `handle` (e.g., `handleEdit`, `handleDelete`)

### Database Operations & Architecture

The app uses a **database abstraction layer** (`main/database-abstraction.js`) that provides a unified interface for both SQLite and MySQL:

```javascript
// Create adapter for specific database type
const adapter = createDatabaseAdapter(wpDirectory, 'sqlite', dbPath); // or 'mysql'
await adapter.connect();
const tables = await adapter.getTables();
await adapter.disconnect();
```

**Database Adapters:**
- `SQLiteAdapter`: Uses better-sqlite3 for synchronous operations
- `MySQLAdapter`: Uses mysql2/promise for asynchronous operations, reads credentials from wp-config.php on each connection

**Critical Security Rules:**

1. **SQL Injection Prevention**: All queries use parameterized statements
2. **MySQL Localhost Only**: MySQL connections restricted to localhost/127.0.0.1/::1
3. **No Credential Caching**: MySQL credentials read fresh from wp-config.php every time
4. **Table Name Validation**: Table names validated against actual database tables

```javascript
// ✅ Good - Using database abstraction layer
const adapter = createDatabaseAdapter(wpDirectory, databaseType, dbPath);
await adapter.connect();
const data = await adapter.getTableData(tableName, offset, limit);
await adapter.disconnect();

// ✅ Good - MySQL adapter handles parameterization internally
// For MySQL: connection.query('SELECT * FROM ?? LIMIT ? OFFSET ?', [tableName, limit, offset])
// For SQLite: db.prepare('SELECT * FROM table LIMIT ? OFFSET ?').all(limit, offset)

// ❌ Bad - Direct string concatenation (SQL injection risk!)
const query = `SELECT * FROM ${tableName} WHERE name = '${userName}'`; // NEVER DO THIS
```

### Database Detection

The app detects available database types:

**SQLite Detection:**
```
{wordpress-directory}/wp-content/database/.ht.sqlite
```

**MySQL Detection:**
```
{wordpress-directory}/wp-config.php (must contain DB_HOST, DB_NAME, DB_USER, DB_PASSWORD)
```

**Detection Flow:**
1. Check for `.ht.sqlite` file → Add 'sqlite' to available types
2. Parse wp-config.php for MySQL credentials → Add 'mysql' to available types (if localhost)
3. If both exist → Prompt user to choose
4. If only one exists → Auto-select
5. Remember user's choice in electron-store

## Development Workflow

### Available Commands

- `npm run dev`: Start development mode (generates icons, runs webpack watch, launches Electron)
- `npm run build`: Build for production
- `npm run generate-all`: Generate all application icons
- `npm run make`: Create platform-specific distributables
- `npm start`: Start the application without watch mode

### Development Mode

When working on the app:
1. Run `npm run dev` to start development server
2. Webpack watches for changes in renderer code
3. React components hot reload automatically
4. Main process changes require app restart

### Building for Release

The project uses GitHub Actions for automated builds on release:
- Workflow: `.github/workflows/release.yml`
- Triggers on new GitHub release creation
- Builds for Windows (Squirrel, WiX), macOS (DMG, ZIP), and Linux (DEB, RPM, ZIP)
- Artifacts automatically uploaded to the release

## Code Style and Conventions

### JavaScript/React

- Use ES6+ syntax (arrow functions, destructuring, template literals)
- Use `const` and `let`, avoid `var`
- Prefer functional components over class components
- Use meaningful variable and function names
- Keep components focused and single-purpose

### Naming Conventions

- **Components**: PascalCase (e.g., `DatabaseViewer`, `TableList`)
- **Files**: Match component names (e.g., `DatabaseViewer.js`)
- **Functions**: camelCase (e.g., `handleSelectDirectory`)
- **Event Handlers**: Prefix with `handle` (e.g., `handleEdit`, `handleDelete`)
- **IPC Channels**: kebab-case (e.g., `select-directory`, `get-table-data`)

### CSS/Styling

- Use Tailwind CSS utility classes
- Keep inline styles for dynamic values only
- Follow existing Tailwind patterns in components
- Use `@tailwindcss/forms` plugin for form elements

## Common Tasks

### Adding a New IPC Handler

1. Add handler in `main/index.js`:
```javascript
ipcMain.handle('my-handler', async (event, arg) => {
  // Implementation
  return result;
});
```

2. Expose in `preload.js`:
```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  myFunction: (arg) => ipcRenderer.invoke('my-handler', arg)
});
```

3. Call from React:
```javascript
const result = await window.electronAPI.myFunction(arg);
```

### Adding a New Component

1. Create component file in `renderer/src/components/`
2. Use functional component with hooks
3. Import and use Tailwind classes for styling
4. Export as default
5. Import in parent component

### Modifying Database Queries

- Always use parameterized statements
- Test with WordPress Studio database
- Handle errors gracefully
- Consider pagination for large result sets

## Testing

### Manual Testing

1. Create test WordPress Studio directory structure:

**macOS/Linux:**
```bash
mkdir -p ~/test-wp-studio/wp-content/database
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Path "$env:USERPROFILE\test-wp-studio\wp-content\database" -Force
```

2. Use the app to open and test functionality
3. Test CRUD operations (Create, Read, Update, Delete)
4. Test pagination with large datasets
5. Test error handling with invalid directories

**Note:** This project does not currently have automated tests. When adding code, ensure manual testing covers:
- Directory selection and validation
- Database type detection and selection
- Table listing (both SQLite and MySQL)
- Data viewing with pagination
- Row editing, adding, and deletion
- Error states and edge cases
- MySQL credential validation
- Localhost-only MySQL connections

## MySQL Support

### wp-config.php Parsing

The `wp-config-parser.js` module extracts MySQL credentials from wp-config.php:
- Supports single and double quoted values
- Handles escaped quotes
- Ignores comments
- Validates extracted values

Required constants: `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
Optional constants: `DB_CHARSET`, `DB_COLLATE`

### Localhost Validation

Valid MySQL hosts (case-insensitive):
- `localhost`
- `127.0.0.1`
- `::1`
- `localhost:3306`
- `127.0.0.1:3306`
- `::1:3306`

Any other host will be rejected with a security error.

### Schema Differences

| Operation | SQLite | MySQL |
|-----------|--------|-------|
| List tables | `SELECT name FROM sqlite_master WHERE type='table'` | `SHOW TABLES` |
| Table schema | `PRAGMA table_info(table)` | `DESCRIBE table` or `INFORMATION_SCHEMA.COLUMNS` |
| Primary key detection | `pk = 1` in PRAGMA result | `Key = 'PRI'` in DESCRIBE result |

The database abstraction layer normalizes these differences into a common schema format:
```javascript
{
  name: string,
  type: string,
  nullable: boolean,
  primaryKey: boolean,
  defaultValue: any
}
```

## Security Considerations

### Critical Security Rules

1. **SQL Injection Prevention**: ALWAYS use parameterized statements via the database abstraction layer
2. **MySQL Localhost Only**: Only localhost MySQL connections permitted, enforced in wp-config-parser.js
3. **No Credential Caching**: MySQL credentials read from wp-config.php on EVERY connection
4. **Read-only Primary Keys**: Primary key fields must not be editable to prevent data corruption
5. **Secure IPC**: Use `contextBridge` to expose limited API surface to renderer
6. **No Credential Storage**: Never cache MySQL credentials in electron-store or memory
7. **Connection Cleanup**: Always call adapter.disconnect() in finally blocks

### When Fixing Bugs or Adding Features

- Validate all user input
- Use the database abstraction layer for all database operations
- Never bypass the adapter layer to access databases directly
- Sanitize file paths
- Handle errors without exposing sensitive information (especially MySQL credentials)
- Follow Electron security best practices
- Review the `.github/copilot-instructions.md` file and make necessary updates
- When performing `.github/copilot-instructions.md` updates, keep them as minimal but as clear as possible
- Only add new files when they are specifically required for the feature

## Platform-Specific Considerations

### Cross-Platform Support

The app supports macOS, Windows, and Linux:
- Use `path.join()` for file paths (not string concatenation)
- Test on target platforms when possible
- Use Electron Forge platform-specific configurations in `forge.config.js`

### Icons and Assets

- Application icons generated from `assets/icons/icon.png`
- Run `npm run generate-all` after changing source icons

## Dependencies

### Core Dependencies

- `better-sqlite3`: Direct SQLite access (main process only)
- `mysql2`: MySQL client with promise and prepared statement support (main process only)
- `electron-store`: Persistent storage for recent directories and database type preferences
- `react` and `react-dom`: UI framework
- `tailwindcss`: Styling
- `@heroicons/react`: Icon library for UI components

### Development Dependencies

- `webpack` and loaders: Bundling
- `electron-forge`: Building and packaging
- `sharp`: Icon processing

### Adding New Dependencies

1. Install via npm: `npm install package-name`
2. Import where needed
3. Ensure compatibility with Electron
4. Test build and packaging still work

## Common Pitfalls to Avoid

1. **Don't** access databases directly from renderer process - always use IPC
2. **Don't** bypass the database abstraction layer - use createDatabaseAdapter()
3. **Don't** use string concatenation for SQL queries - adapters handle parameterization
4. **Don't** forget to disconnect() adapters after use - can leak connections
5. **Don't** cache MySQL credentials - read fresh from wp-config.php every time
6. **Don't** allow remote MySQL connections - only localhost permitted
7. **Don't** modify primary keys when editing rows
8. **Don't** forget to validate directory structure before accessing database
9. **Don't** expose credentials in error messages or logs

## Helpful Context

- The app supports both WordPress Studio (SQLite) and traditional WordPress (MySQL) installations
- SQLite database path: `wp-content/database/.ht.sqlite`
- MySQL credentials: `wp-config.php` (DB_HOST, DB_NAME, DB_USER, DB_PASSWORD)
- The app stores recent directories and database type preferences using `electron-store`
- Database type selection is remembered per directory
- For detailed MySQL implementation, see `MYSQL-SUPPORT.md`
