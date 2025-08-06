const fs = require("fs");
const pgp = require("pg-promise")();
require("dotenv").config();

const db = pgp(process.env.DATABASE_URL);

const estudiantes = JSON.parse(fs.readFileSync("estudiantes.json", "utf8"));

async function insertarEstudiantes() {
  try {
    for (const estudiante of estudiantes) {
      await db.none(
        "INSERT INTO estudiantes(name, curso, points) VALUES($1, $2, $3)",
        [estudiante.name, estudiante.curso, estudiante.points]
      );
    }
    console.log("✅ Estudiantes insertados correctamente");
  } catch (error) {
    console.error("❌ Error al insertar estudiantes:", error);
  }
}

insertarEstudiantes();
