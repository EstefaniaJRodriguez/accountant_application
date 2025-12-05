// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// 🔹 Conexión a la base
import pool from './db.js';

// 🔹 Rutas existentes
import altaRoutes from './routes/altaMonotributo.js';
import bajaRoutes from './routes/bajaMonotributo.js';
import recategoRoutes from './routes/recatego.js';
import adminRoutes from './routes/adminRoutes.js';
import pagosRoutes from "./routes/pagosRoutes.js";
import consultaRoutes from "./routes/emailConsultaRoutes.js";
import monotributoRoutes from "./routes/calcularMonotributoRoutes.js";
import verifyToken from './middleware/middleware.js';
import loginRoutes from './routes/login.js';


// 🔹 Rutas nuevas de login
import authRoutes from "./routes/auth.js";


const app = express();


// =========================
// 🔸 CORS
// =========================
const allowedOrigins = [
  'http://localhost:5173',
  'https://accountant-application-front.onrender.com',
  'https://www.genimpositivo.com/',
  'https://www.genimpositivo.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origen no permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// =========================
// 🔸 Probar conexión DB
// =========================
pool.connect()
  .then(() => console.log('✅ Conectado a la base de datos'))
  .catch(err => console.error('❌ Error al conectar con la base', err));


// =========================
// 🔸 Rutas API EXISTENTES
// =========================
app.use('/api/alta', altaRoutes);
app.use('/api/baja', bajaRoutes);
app.use('/api/recatego', recategoRoutes);
aapp.use('/api/admin', verifyToken, adminRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/consultas', consultaRoutes);
app.use('/api/monotributo', monotributoRoutes);
app.use('/api/login', loginRoutes);



// =========================
// 🔸 Rutas nuevas: LOGIN
// =========================
app.use("/api", authRoutes);  
// Esto habilita: POST /api/login


// =========================
// 🔸 Puerto
// =========================
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
