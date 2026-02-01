const Database = require('better-sqlite3');
const mysql = require('mysql2/promise');
const { parseWpConfig } = require('./wp-config-parser');

/**
 * Base class for database adapters
 */
class DatabaseAdapter {
  async connect() {
    throw new Error('connect() must be implemented');
  }

  async disconnect() {
    throw new Error('disconnect() must be implemented');
  }

  async getTables() {
    throw new Error('getTables() must be implemented');
  }

  async getTableSchema(tableName) {
    throw new Error('getTableSchema() must be implemented');
  }

  async getTableData(tableName, offset, limit) {
    throw new Error('getTableData() must be implemented');
  }

  async getRowCount(tableName) {
    throw new Error('getRowCount() must be implemented');
  }

  async executeQuery(query) {
    throw new Error('executeQuery() must be implemented');
  }

  async updateRow(tableName, primaryKey, rowId, data) {
    throw new Error('updateRow() must be implemented');
  }

  async deleteRow(tableName, primaryKey, rowId) {
    throw new Error('deleteRow() must be implemented');
  }

  async insertRow(tableName, data) {
    throw new Error('insertRow() must be implemented');
  }
}

/**
 * SQLite database adapter
 */
class SQLiteAdapter extends DatabaseAdapter {
  constructor(dbPath) {
    super();
    this.dbPath = dbPath;
    this.db = null;
  }

  async connect() {
    this.db = new Database(this.dbPath, { readonly: false });
  }

  async disconnect() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  async getTables() {
    const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    // Filter out hidden tables (starting with underscore)
    return tables.filter(t => !t.name.startsWith('_')).map(t => t.name);
  }

  async getTableSchema(tableName) {
    const schema = this.db.prepare(`PRAGMA table_info(${tableName})`).all();
    // Convert SQLite schema to common format
    return schema.map(col => ({
      name: col.name,
      type: col.type,
      nullable: col.notnull === 0,
      primaryKey: col.pk === 1,
      defaultValue: col.dflt_value
    }));
  }

  async getTableData(tableName, offset, limit) {
    const data = this.db.prepare(`SELECT * FROM ${tableName} LIMIT ? OFFSET ?`).all(limit, offset);
    return data;
  }

  async getRowCount(tableName) {
    const result = this.db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
    return result.count;
  }

  async executeQuery(query) {
    if (query.trim().toUpperCase().startsWith('SELECT')) {
      return this.db.prepare(query).all();
    } else {
      const stmt = this.db.prepare(query);
      return stmt.run();
    }
  }

  async updateRow(tableName, primaryKey, rowId, data) {
    const columns = Object.keys(data);
    const setClause = columns.map(col => `${col} = ?`).join(', ');
    const values = columns.map(col => data[col]);
    
    const stmt = this.db.prepare(`UPDATE ${tableName} SET ${setClause} WHERE ${primaryKey} = ?`);
    return stmt.run(...values, rowId);
  }

  async deleteRow(tableName, primaryKey, rowId) {
    const stmt = this.db.prepare(`DELETE FROM ${tableName} WHERE ${primaryKey} = ?`);
    return stmt.run(rowId);
  }

  async insertRow(tableName, data) {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(col => data[col]);
    
    const stmt = this.db.prepare(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`);
    return stmt.run(...values);
  }
}

/**
 * MySQL database adapter
 */
class MySQLAdapter extends DatabaseAdapter {
  constructor(wpDirectory) {
    super();
    this.wpDirectory = wpDirectory;
    this.connection = null;
  }

  async connect() {
    // Read credentials fresh from wp-config.php
    const credentials = parseWpConfig(this.wpDirectory);
    if (!credentials) {
      throw new Error('Unable to read MySQL credentials from wp-config.php');
    }

    // Extract host and port
    const [host, port] = credentials.DB_HOST.includes(':') 
      ? credentials.DB_HOST.split(':') 
      : [credentials.DB_HOST, '3306'];

    this.connection = await mysql.createConnection({
      host: host,
      port: parseInt(port, 10),
      user: credentials.DB_USER,
      password: credentials.DB_PASSWORD || '',
      database: credentials.DB_NAME,
      charset: credentials.DB_CHARSET || 'utf8mb4'
    });
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }

  async getTables() {
    const [rows] = await this.connection.query('SHOW TABLES');
    const tableKey = Object.keys(rows[0])[0];
    // Filter out hidden tables (starting with underscore)
    return rows.filter(row => !row[tableKey].startsWith('_')).map(row => row[tableKey]);
  }

  async getTableSchema(tableName) {
    const [rows] = await this.connection.query(`DESCRIBE ??`, [tableName]);
    // Convert MySQL schema to common format
    return rows.map(col => ({
      name: col.Field,
      type: col.Type,
      nullable: col.Null === 'YES',
      primaryKey: col.Key === 'PRI',
      defaultValue: col.Default
    }));
  }

  async getTableData(tableName, offset, limit) {
    const [rows] = await this.connection.query(
      `SELECT * FROM ?? LIMIT ? OFFSET ?`,
      [tableName, limit, offset]
    );
    return rows;
  }

  async getRowCount(tableName) {
    const [rows] = await this.connection.query(`SELECT COUNT(*) as count FROM ??`, [tableName]);
    return rows[0].count;
  }

  async executeQuery(query) {
    const [rows] = await this.connection.query(query);
    return rows;
  }

  async updateRow(tableName, primaryKey, rowId, data) {
    const columns = Object.keys(data);
    const setClause = columns.map(col => `?? = ?`).join(', ');
    const params = [];
    
    columns.forEach(col => {
      params.push(col, data[col]);
    });
    
    params.push(primaryKey, rowId);
    
    const [result] = await this.connection.query(
      `UPDATE ?? SET ${setClause} WHERE ?? = ?`,
      [tableName, ...params]
    );
    return result;
  }

  async deleteRow(tableName, primaryKey, rowId) {
    const [result] = await this.connection.query(
      `DELETE FROM ?? WHERE ?? = ?`,
      [tableName, primaryKey, rowId]
    );
    return result;
  }

  async insertRow(tableName, data) {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(col => data[col]);
    
    const [result] = await this.connection.query(
      `INSERT INTO ?? (${columns.map(() => '??').join(', ')}) VALUES (${placeholders})`,
      [tableName, ...columns, ...values]
    );
    return result;
  }
}

/**
 * Factory function to create appropriate database adapter
 * @param {string} wpDirectory - WordPress installation directory
 * @param {string} databaseType - 'sqlite' or 'mysql'
 * @param {string} dbPath - SQLite database path (only for SQLite)
 * @returns {DatabaseAdapter}
 */
function createDatabaseAdapter(wpDirectory, databaseType, dbPath = null) {
  if (databaseType === 'sqlite') {
    if (!dbPath) {
      throw new Error('dbPath required for SQLite adapter');
    }
    return new SQLiteAdapter(dbPath);
  } else if (databaseType === 'mysql') {
    return new MySQLAdapter(wpDirectory);
  } else {
    throw new Error(`Unknown database type: ${databaseType}`);
  }
}

module.exports = {
  DatabaseAdapter,
  SQLiteAdapter,
  MySQLAdapter,
  createDatabaseAdapter
};
