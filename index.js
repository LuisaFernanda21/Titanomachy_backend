const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const { Pool } = require('pg');

// Cargar variables de entorno
require('dotenv').config();

// Configuración del servidor
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Puerto dinámico para Railway o 8080 local
const PORT = process.env.PORT || 8080;

// Configuración de conexión a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Ruta de prueba para verificar si el servidor responde
app.get('/', (req, res) => {
  res.send('Servidor funcionando correctamente ✅');
});

// Ruta principal para obtener todos los estudiantes
app.get('/estudiantes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM estudiantes');
    res.json(result.rows);
  } catch (error) {
    console.error('Error en /estudiantes:', error);
    res.status(500).json({ error: 'Error al obtener estudiantes' });
  }
});

// Socket.IO para notificaciones en tiempo real (opcional)
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
