const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(express.json());

// Conexión a PostgreSQL con Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Desde archivo .env
  ssl: {
    rejectUnauthorized: false,
  },
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor funcionando');
});

// Obtener todos los estudiantes
app.get('/estudiantes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM estudiantes ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener estudiantes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});

// Socket.IO: actualizar en tiempo real (si lo necesitas después)
io.on('connection', (socket) => {
  console.log('Cliente conectado');

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});
