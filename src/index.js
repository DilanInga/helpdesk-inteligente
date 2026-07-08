const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno (solo tiene efecto en local; en Vercel las variables ya vienen inyectadas)
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Rutas
const ticketRoutes = require('./routes/tickets');
app.use('/api/tickets', ticketRoutes);

// Ruta de prueba para verificar que el servidor y la BD funcionan
app.get('/api/health', (req, res) => {
  const estados = ['desconectado', 'conectado', 'conectando', 'desconectando'];
  res.json({
    status: 'OK',
    mensaje: 'Help Desk Inteligente funcionando correctamente',
    dbState: mongoose.connection.readyState,
    dbEstadoTexto: estados[mongoose.connection.readyState],
    fecha: new Date().toISOString()
  });
});

// --- Conexión a MongoDB cacheada, apta para entorno serverless ---
let conexionPromesa = null;

function conectarDB() {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve();
  }
  if (!conexionPromesa) {
    conexionPromesa = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000
    })
      .then(() => {
        console.log('✅ Conectado a MongoDB Atlas');
      })
      .catch((error) => {
        conexionPromesa = null; // permite reintentar en la próxima petición
        console.error('❌ Error conectando a MongoDB:', error.message);
        throw error;
      });
  }
  return conexionPromesa;
}

// Middleware: asegura que haya conexión a la BD antes de atender cualquier /api
app.use('/api', async (req, res, next) => {
  try {
    await conectarDB();
    next();
  } catch (error) {
    res.status(503).json({
      success: false,
      mensaje: 'Sin conexión a la base de datos',
      error: error.message
    });
  }
});

// Solo levantar el servidor con app.listen si se ejecuta localmente
// (en Vercel, este archivo se usa como función serverless, no como servidor persistente)
if (require.main === module) {
  conectarDB().then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  });
}

module.exports = app;