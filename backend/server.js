// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// 🔹 Conexión a la base
import pool from './db.js';

// 🔹 Rutas
import altaRoutes from './routes/AltaMonotributo.js';
import bajaRoutes from './routes/bajaMonotributo.js';
import recategoRoutes from './routes/recatego.js';
import adminRoutes from './routes/adminRoutes.js';
import pagosRouter from "./routes/pagosRoutes.js";
import consultaRoutes from "./routes/emailConsultaRoutes.js";
import monotributoRoutes from "./routes/calcularMonotributoRoutes.js";

const app = express();


// =========================
// 🔸 CORS
// =========================
const allowedOrigins = [
  'http://localhost:5173',
  'https://tu-frontend.netlify.app', // 🔹 reemplazalo con tu URL real en Netlify
];

const corsOptions = {
  origin: function (origin, callback) {
    // permitir requests desde frontend o local
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));


// =========================
// 🔸 Middleware
// =========================
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// =========================
// 🔸 Probar conexión DB
// =========================
pool.connect()
  .then(() => console.log('✅ Conectado a la base de datos'))
  .catch(err => console.error('❌ Error al conectar con la base', err));


// =========================
// 🔸 Rutas API
// =========================
app.use('/api/alta', altaRoutes);
app.use('/api/baja', bajaRoutes);
app.use('/api/recatego', recategoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pagos', pagosRouter);
app.use('/api/consultas', consultaRoutes);
app.use('/api/monotributo', monotributoRoutes);


// =========================
// 🔸 Puerto
// =========================
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
