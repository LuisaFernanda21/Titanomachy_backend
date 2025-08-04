const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Configura tu conexión a PostgreSQL
const pool = new Pool({
  connectionString: "postgresql://leaderboard_330l_user:O7EcrAHLA9bfca3Y2jbB8i1qub9YvwAw@dpg-d1t211ruibrs738q5pbg-a.oregon-postgres.render.com/leaderboard_330l",
  ssl: {
    rejectUnauthorized: false
  }
});

// Ruta GET para obtener los estudiantes
app.get("/estudiantes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM public.estudiantes ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener estudiantes:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
