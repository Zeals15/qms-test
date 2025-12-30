// server/seed-admin.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

(async () => {
  try {
    const {
      MYSQLHOST,
      MYSQLUSER,
      MYSQLPASSWORD,
      MYSQLDATABASE,
      MYSQLPORT,
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
    } = process.env;

    if (!MYSQLHOST || !MYSQLUSER || !MYSQLPASSWORD || !MYSQLDATABASE) {
      throw new Error('Missing MySQL environment variables');
    }

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set');
    }

    const conn = await mysql.createConnection({
      host: MYSQLHOST,
      user: MYSQLUSER,
      password: MYSQLPASSWORD,
      database: MYSQLDATABASE,
      port: Number(MYSQLPORT || 3306),
      ssl: { rejectUnauthorized: false },
    });

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // 🔐 UPSERT ADMIN (create or update safely)
    await conn.query(
      `
      INSERT INTO users (email, name, password_hash, role, is_active)
      VALUES (?, 'Admin', ?, 'admin', 1)
      ON DUPLICATE KEY UPDATE
        password_hash = VALUES(password_hash),
        is_active = 1,
        role = 'admin'
      `,
      [ADMIN_EMAIL, passwordHash]
    );

    console.log('✅ Admin user created / updated successfully');
    console.log(`👉 Email: ${ADMIN_EMAIL}`);

    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Admin seed failed:', err);
    process.exit(1);
  }
})();
