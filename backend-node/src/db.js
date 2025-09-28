const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const connectionString = process.env.DB_URL || 'postgresql://app:app@localhost:5432/control_personal';

const pool = new Pool({ connectionString });

pool.on('error', (err) => {
  console.error('DB error', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
