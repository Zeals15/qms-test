// server/db.js
const mysql = require('mysql2/promise');

let pool = null;

function initPool() {
  if (pool) return pool;

  const {
    // Railway variables
    MYSQLHOST,
    MYSQLUSER,
    MYSQLPASSWORD,
    MYSQLDATABASE,
    MYSQLPORT,

    // Optional local fallback
    MYSQL_HOST,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_DATABASE,
    MYSQL_PORT,
  } = process.env;

  // Prefer Railway-style variables if present
  const isRailway =
    MYSQLHOST && MYSQLUSER && MYSQLPASSWORD && MYSQLDATABASE;

  let config;

  if (isRailway) {
    // ✅ Railway MySQL (correct for your screenshots)
    config = {
      host: MYSQLHOST,
      user: MYSQLUSER,
      password: MYSQLPASSWORD,
      database: MYSQLDATABASE,
      port: Number(MYSQLPORT || 3306),
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };
  } else {
    // ✅ Local / manual MySQL
    if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_PASSWORD || !MYSQL_DATABASE) {
      throw new Error(
        'Missing database env vars. Set Railway MYSQL* vars or local MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE.'
      );
    }

    config = {
      host: MYSQL_HOST,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      port: Number(MYSQL_PORT || 3306),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };
  }

  pool = mysql.createPool(config);
  return pool;
}

module.exports = {
  getConnection: async () => {
    const p = initPool();
    return p.getConnection();
  },

  endPool: async () => {
    if (pool) {
      await pool.end();
      pool = null;
    }
  },
};
