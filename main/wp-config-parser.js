const fs = require('fs');
const path = require('path');

/**
 * Parse wp-config.php to extract database credentials
 * @param {string} wpDirectory - Path to WordPress installation directory
 * @returns {object|null} Database credentials or null if parsing fails
 */
function parseWpConfig(wpDirectory) {
  const wpConfigPath = path.join(wpDirectory, 'wp-config.php');
  
  try {
    // Check if wp-config.php exists
    if (!fs.existsSync(wpConfigPath)) {
      return null;
    }

    const content = fs.readFileSync(wpConfigPath, 'utf8');
    const credentials = {
      DB_HOST: null,
      DB_NAME: null,
      DB_USER: null,
      DB_PASSWORD: null,
      DB_CHARSET: null,
      DB_COLLATE: null
    };

    // Parse each define statement
    const defineRegex = /define\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"\\]*(?:\\.[^'"\\]*)*)['\"]\s*\)/gi;
    let match;

    while ((match = defineRegex.exec(content)) !== null) {
      const key = match[1];
      const value = match[2];
      
      // Unescape the value
      const unescapedValue = value.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      
      if (credentials.hasOwnProperty(key)) {
        credentials[key] = unescapedValue;
      }
    }

    // Validate required credentials exist
    if (!credentials.DB_HOST || !credentials.DB_NAME || !credentials.DB_USER) {
      return null;
    }

    // Validate host is localhost
    if (!isLocalhost(credentials.DB_HOST)) {
      throw new Error('MySQL host must be localhost or 127.0.0.1 for security reasons');
    }

    return credentials;
  } catch (error) {
    console.error('Error parsing wp-config.php:', error);
    throw error;
  }
}

/**
 * Check if host is localhost
 * @param {string} host - Database host
 * @returns {boolean} True if localhost
 */
function isLocalhost(host) {
  const localhostVariants = [
    'localhost',
    '127.0.0.1',
    '::1',
    'localhost:3306',
    '127.0.0.1:3306',
    '::1:3306'
  ];
  
  return localhostVariants.includes(host.toLowerCase());
}

/**
 * Check if wp-config.php exists and has valid MySQL credentials
 * @param {string} wpDirectory - Path to WordPress installation directory
 * @returns {boolean} True if valid MySQL config exists
 */
function hasValidMySQLConfig(wpDirectory) {
  try {
    const credentials = parseWpConfig(wpDirectory);
    return credentials !== null;
  } catch (error) {
    return false;
  }
}

module.exports = {
  parseWpConfig,
  isLocalhost,
  hasValidMySQLConfig
};
