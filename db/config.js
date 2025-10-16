const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'myportofolio',
  password: 'postgres',
  port: 5432,
});

module.exports = pool;