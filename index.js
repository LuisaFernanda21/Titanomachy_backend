const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// ✅ Conexión a la base de datos PostgreSQL en Render
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// ✅ Ruta: obtener estudiantes ordenados por puntos
app.get('/estudiantes', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM estudiantes ORDER BY puntos DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener estudiantes:', error);
    res.status(500).json({ error: 'Error al obtener estudiantes' });
  }
});

// ✅ Ruta: actualizar puntos con clave docente
app.post('/puntos', async (req, res) => {
  const { nombreEstudiante, puntos, docente, clave } = req.body;

  if (clave !== 'CLAVE_SECRETA') {
    return res.status(403).json({ error: 'Clave inválida' });
  }

  try {
    const { rows } = await db.query('SELECT * FROM estudiantes WHERE nombre ILIKE $1', [`%${nombreEstudiante}%`]);
    if (rows.length === 0) return res.status(404).json({ error: 'Estudiante no encontrado' });

    const estudiante = rows[0];
    const nuevoPuntaje = estudiante.puntos + puntos;

    await db.query('UPDATE estudiantes SET puntos = $1 WHERE id = $2', [nuevoPuntaje, estudiante.id]);
    await db.query('INSERT INTO historial (estudiante_id, puntos, docente) VALUES ($1, $2, $3)', [estudiante.id, puntos, docente]);

    io.emit('actualizarRanking');
    res.json({ mensaje: 'Puntos actualizados correctamente' });
  } catch (err) {
    console.error('Error al actualizar puntos:', err);
    res.status(500).json({ error: 'Error al actualizar puntos' });
  }
});

// ✅ Puerto dinámico para Railway o 3001 localmente
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
