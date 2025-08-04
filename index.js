const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const { Pool } = require('pg');

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

// Conexión a PostgreSQL usando DATABASE_URL desde Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Endpoint para obtener todos los estudiantes
app.get('/estudiantes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM estudiantes');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener estudiantes', error);
    res.status(500).json({ error: 'Error al obtener estudiantes' });
  }
});

// Endpoint para actualizar puntos
app.post('/update', async (req, res) => {
  const { name, puntos, docente } = req.body;

  try {
    await pool.query('UPDATE estudiantes SET puntos = puntos + $1 WHERE name = $2', [puntos, name]);

    await pool.query(
      'INSERT INTO historial (docente, estudiante, puntos, fecha) VALUES ($1, $2, $3, NOW())',
      [docente, name, puntos]
    );

    io.emit('actualizacionPuntos', { name, puntos });
    res.status(200).json({ mensaje: 'Puntos actualizados correctamente' });
  } catch (error) {
    console.error('Error al actualizar puntos', error);
    res.status(500).json({ error: 'Error al actualizar puntos' });
  }
});

// Endpoint para obtener el ranking
app.get('/ranking', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM estudiantes ORDER BY puntos DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener ranking', error);
    res.status(500).json({ error: 'Error al obtener ranking' });
  }
});

// Escuchar en el puerto asignado por Railway
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
