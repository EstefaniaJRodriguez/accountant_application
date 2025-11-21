// db.js
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

// ✅ Usa DATABASE_URL si está definida (Render, Supabase, etc.)
let connectionConfig = {};  

if (process.env.DATABASE_URL) {
  connectionConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // necesario para Supabase / Render
  };
} else {
  // ✅ Configuración local
  connectionConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    port: Number(process.env.DB_PORT) || 5432,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  };
}

// ✅ Forzar IPv4 si tu red no soporta IPv6 (error ENETUNREACH)
connectionConfig.host = connectionConfig.host?.replace('::1', '127.0.0.1');

const pool = new Pool(connectionConfig);

// 🔹 Probar conexión (opcional)
pool.connect()
  .then(() => console.log('✅ Conectado correctamente a la base de datos'))
  .catch(err => console.error('❌ Error al conectar con la base de datos:', err.message));

export default pool;
