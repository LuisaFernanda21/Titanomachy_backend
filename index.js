const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
const { Pool } = require("pg");

const app = express();
const server = http.createServer(app);

// CORS
app.use(cors());
app.use(express.json());

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Socket.IO - conexión
io.on("connection", (socket) => {
  console.log("Usuario conectado");
  socket.on("disconnect", () => {
    console.log("Usuario desconectado");
  });
});

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Backend funcionando en Railway 🚂");
});

// Ruta para obtener estudiantes
app.get("/estudiantes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM estudiantes ORDER BY puntos DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener estudiantes:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Actualizar puntos
app.post("/update", async (req, res) => {
  const { name, puntos, docente } = req.body;
  try {
    const result = await pool.query(
      "UPDATE estudiantes SET puntos = puntos + $1 WHERE name = $2 RETURNING *",
      [puntos, name]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Estudiante no encontrado" });
    }

    await pool.query(
      "INSERT INTO historial (docente, estudiante, puntos, fecha) VALUES ($1, $2, $3, NOW())",
      [docente, name, puntos]
    );

    io.emit("actualizacion");
    res.json({ success: true });
  } catch (error) {
    console.error("Error al actualizar puntos:", error);
    res.status(500).json({ error: "Error al actualizar puntos" });
  }
});

// Historial de cambios
app.get("/historial", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM historial ORDER BY fecha DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({ error: "Error al obtener historial" });
  }
});

// Puerto dinámico para Railway
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
