require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.static('public')); // Serve frontend files

// Variables de entorno
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Conexión a MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log(' Conectado a MongoDB con éxito'))
  .catch((err) => console.error(' Error al conectar a MongoDB:', err));

// Rutas API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));

// Ruta de prueba
app.get('/', (req, res) => {
  // If static file serving works, this might not be reached for root, 
  // but it's good fallback or we can redirect to index.html explicitly if needed.
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(PORT, () => {
  console.log(` Servidor corriendo en http://localhost:${PORT}`);
});
