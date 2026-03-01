require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.static('public')); // Serve frontend files

// Variables de entorno
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const errorHandler = require('./middleware/errorHandler');

// Conexión a MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log(' Conectado a MongoDB con éxito'))
  .catch((err) => console.error(' Error al conectar a MongoDB:', err));

// Rutas API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/external', require('./routes/external'));

// Ruta para manejar el Frontend (SPA Fallback)
// En Express 5, los wildcards deben ser nombrados (ej. /*splat)
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware de manejo de errores (Debe ir al final)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(` Servidor corriendo en http://localhost:${PORT}`);
});
