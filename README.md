# WP SQLite

<img src="https://github.com/jonathanbossenger/wp-sqlite/blob/main/assets/icons/icon.png" width="48">

A desktop application for viewing and editing databases in WordPress installations. Supports both SQLite (WordPress Studio) and MySQL databases. Built with Electron and React.

## Table of Contents
- [Features](#features)
- [Screenshots](#screenshots)
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Building Executables](#building-executables)
- [Creating Releases](#creating-releases)
- [Usage](#usage)
- [Technical Stack](#technical-stack)
- [License](#license)

## Features

- **Multi-Database Support**
  - SQLite databases (WordPress Studio installations)
  - MySQL databases (traditional WordPress installations)
  - Automatic database type detection
  - Choose between database types when both are available
  - Visual database type indicator (SQLite/MySQL badge)
  
- **WordPress Integration**
  - Automatic detection of WordPress installations
  - Finds SQLite database in wp-content/database/.ht.sqlite
  - Reads MySQL credentials from wp-config.php
  - Recent directories support for quick access
  - Localhost-only MySQL connections for security
  
- **Database Viewing**
  - View all tables in the database
  - Browse table data with pagination (50 rows per page)
  - View table schema with primary key indicators
  - Search/filter within table data by specific columns or all columns
  
- **Data Editing**
  - Edit existing rows with modal editor
  - Delete rows (with confirmation)
  - Add new rows
  - Automatic data type detection
  - Primary key protection
  
- **User Interface**
  - Clean, modern UI with real-time updates
  - Cross-platform support (macOS, Windows, Linux)
  - Responsive design

## Screenshots

### Main Application Interface
![WP SQLite Application](screenshots/Screenshot-01.png)

### Additional Views
<p align="center">
  <img src="screenshots/Screenshot-02.png" width="250" alt="Screenshot 2" />
  <img src="screenshots/Screenshot-03.png" width="250" alt="Screenshot 3" />
  <img src="screenshots/Screenshot-04.png" width="250" alt="Screenshot 4" />
</p>

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- For testing:
  - A [WordPress Studio](https://developer.wordpress.com/studio/) installation ([GitHub](https://github.com/Automattic/studio/)) for SQLite support
  - Or a traditional WordPress installation with MySQL for MySQL support

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/jonathanbossenger/wp-sqlite.git
cd wp-sqlite
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

This will:
- Generate application icons
- Start webpack in watch mode for the renderer process
- Launch Electron in development mode
- Enable hot reloading for React components

## Building Executables

The project uses Electron Forge for building platform-specific executables.

### Build for all platforms:
```bash
npm run make
```

This will create executables in the `out/make` directory for:
- macOS (.dmg)
- Windows (.exe)
- Linux (.deb, .rpm)

### Platform-specific builds:

For macOS:
```bash
npm run make -- --platform=darwin
```

For Windows:
```bash
npm run make -- --platform=win32
```

For Linux:
```bash
npm run make -- --platform=linux
```

## Creating Releases

The repository includes a GitHub Actions workflow that automatically builds the application for all platforms when a new release is created.

### To create a new release:

1. Update the version in `package.json`
2. Commit the version change
3. Create and push a new git tag:
```bash
git tag v1.0.0
git push origin v1.0.0
```
4. Create a new release on GitHub:
   - Go to the repository's Releases page
   - Click "Draft a new release"
   - Select the tag you just created
   - Add release notes
   - Click "Publish release"

The GitHub Actions workflow will automatically:
- Build the application for Windows, macOS, and Linux
- Upload the following artifacts to the release:
  - **Windows**: `.exe` installer (Squirrel), `.msi` installer (WiX)
  - **macOS**: `.dmg` installer, `.zip` archive
  - **Linux**: `.deb` package, `.rpm` package, `.zip` archive

Users can then download and install the appropriate version for their operating system directly from the GitHub release page.

## Usage

### Getting Started

1. Launch the application
2. Select your WordPress installation directory
3. The app will automatically detect available database types:
   - **SQLite**: Found at wp-content/database/.ht.sqlite (WordPress Studio)
   - **MySQL**: Credentials from wp-config.php (traditional WordPress)
4. If both database types are available, choose which one to use
5. Browse the list of tables and select one to view its data

### Working with Data

**Viewing Tables:**
- Select a table from the list on the left
- Use pagination controls to navigate through rows (50 rows per page)
- Primary key columns are marked with (PK)
- The database type badge (SQLite/MySQL) shows which database you're viewing

**Searching/Filtering:**
1. Select a column from the dropdown menu (or "All Columns" to search across all fields)
2. Type your search query in the search box
3. The table will automatically filter to show only matching rows
4. The search is case-insensitive and matches partial text

**Editing Data:**
1. Click "Edit" on any row to open the edit modal
2. Modify the values (primary key fields are read-only)
3. Click "Save Changes" to update the row
4. Changes are immediately saved to the database

**Adding Rows:**
1. Click the "Add Row" button
2. Fill in the values for each field
3. Auto-increment primary keys are automatically hidden
4. Click "Save" to insert the new row

**Deleting Data:**
1. Click "Delete" on any row
2. Confirm the deletion
3. The row is permanently removed from the database

### MySQL Support

**Requirements:**
- MySQL server must be running on localhost (127.0.0.1)
- Valid wp-config.php with database credentials
- Database credentials must be for a localhost MySQL server (remote connections are blocked for security)

**Security:**
- MySQL credentials are read fresh from wp-config.php on each connection
- Credentials are never cached or stored
- Only localhost connections are permitted
- All queries use parameterized statements to prevent SQL injection

**Switching Database Types:**
To switch between SQLite and MySQL (when both are available):
1. Click "Change Directory"
2. Select the same directory again
3. Choose the database type you want to use

## Technical Stack

- **Desktop Framework:** Electron
- **UI Framework:** React
- **Styling:** Tailwind CSS
- **Database Access:**
  - better-sqlite3 - SQLite database interface
  - mysql2 - MySQL database interface
- **Build Tools:**
  - Webpack - Module bundler
  - Electron Forge - Building and packaging
- **Other:**
  - Sharp - Image processing for icons
  - electron-store - Persistent storage for user preferences

For detailed implementation information about MySQL support, see [MYSQL-SUPPORT.md](MYSQL-SUPPORT.md).

## Development Scripts

- `npm run dev` - Start the application in development mode
- `npm run build` - Build the renderer process
- `npm run generate-icons` - Generate application icons
- `npm run generate-all` - Generate all icons
- `npm run package` - Package the application without creating installers
- `npm run make` - Create platform-specific distributables

## License

GPL-2.0-or-later
