import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

async function setup() {
  const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: Number(process.env.PG_PORT),
  });

  try {
    await pool.connect();
    
    // Enable the vector extension
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector;');
    
    // Create table for hive notes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hive_notes (
        id SERIAL PRIMARY KEY,
        date date,
        time time,
        weather varchar(200),
        beekeepers varchar(200),
        hive_id varchar(10),
        notes text,
        embedding vector(1536)
      );
    `);

    console.log('Database setup complete!');
  } catch (err) {
    console.error('Error setting up database:', err);
  } finally {
    await pool.end();
  }
}

setup();