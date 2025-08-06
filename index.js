const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

// Importar módulos locales
const {
  getEstudiantes,
  getRanking,
  getEstudianteById,
  getEstudiantesByCurso,
  findEstudianteByName,
  updateEstudiantePoints,
  getCursos
} = require("./estudiantes");

const app = express();
const PORT = process.env.PORT || 3001;
const PASSWORD = "torneo2025";

console.log("🚀 Iniciando servidor TITANOMACHY...");

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configurar para servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

console.log("✅ Módulos importados correctamente");
console.log(`🔧 Configurando servidor en puerto ${PORT}`);

// Middleware de logging para todas las requests
app.use((req, res, next) => {
  console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Middleware para verificar contraseña
const verifyPassword = (req, res, next) => {
  const { password } = req.body;
  if (password !== PASSWORD) {
    return res.status(401).json({ error: "Contraseña incorrecta" });
  }
  next();
};

// ===== RUTAS PRINCIPALES =====

// Ruta de salud del servidor
app.get("/health", (req, res) => {
  const estudiantes = getEstudiantes();
  res.json({
    status: "OK",
    message: "TITANOMACHY Server is running",
    timestamp: new Date().toISOString(),
    students_loaded: estudiantes.length,
    port: PORT
  });
});

// Ruta de debug
app.get("/debug", (req, res) => {
  const estudiantes = getEstudiantes();
  res.json({
    server: "TITANOMACHY Backend",
    estudiantes_count: estudiantes.length,
    sample_estudiante: estudiantes[0] || null,
    available_endpoints: [
      "/health",
      "/ranking",
      "/estudiantes",
      "/ranking/cursos-total",
      "/cursos",
      "/estudiantes/:identifier",
      "/estudiantes/:identifier/sumar",
      "/estudiantes/:identifier/restar"
    ]
  });
});

// Ruta: obtener ranking general
app.get("/ranking", async (req, res) => {
  try {
    const ranking = getRanking();
    res.json(ranking);
  } catch (error) {
    console.error("❌ Error al obtener ranking:", error);
    res.status(500).json({ 
      error: "Error al obtener ranking",
      details: error.message
    });
  }
});

// Ruta: obtener todos los estudiantes
app.get("/estudiantes", async (req, res) => {
  try {
    const estudiantes = getEstudiantes();
    res.json(estudiantes);
  } catch (error) {
    console.error("❌ Error al obtener estudiantes:", error);
    res.status(500).json({ 
      error: "Error al obtener estudiantes",
      details: error.message
    });
  }
});

// Ruta: obtener ranking por cursos
app.get("/ranking/cursos-total", async (req, res) => {
  try {
    const estudiantes = getEstudiantes();
    
    // Agrupar estudiantes por curso y calcular estadísticas
    const cursoStats = {};
    
    estudiantes.forEach(estudiante => {
      const curso = estudiante.curso;
      if (!cursoStats[curso]) {
        cursoStats[curso] = {
          curso: curso,
          total_estudiantes: 0,
          total_puntos: 0
        };
      }
      cursoStats[curso].total_estudiantes++;
      cursoStats[curso].total_puntos += estudiante.puntos || 0;
    });

    // Convertir a array y calcular promedios
    const rankingCursos = Object.values(cursoStats)
      .map(curso => ({
        ...curso,
        promedio_puntos: parseFloat((curso.total_puntos / curso.total_estudiantes).toFixed(1))
      }))
      .sort((a, b) => b.total_puntos - a.total_puntos);
    
    res.json(rankingCursos);
  } catch (error) {
    console.error("❌ Error al obtener ranking por cursos:", error);
    res.status(500).json({ 
      error: "Error al obtener ranking por cursos",
      details: error.message
    });
  }
});

// Ruta: obtener estudiantes por curso
app.get("/ranking/:curso", async (req, res) => {
  try {
    const { curso } = req.params;
    const estudiantes = getEstudiantesByCurso(curso);
    res.json(estudiantes);
  } catch (error) {
    console.error("❌ Error al obtener estudiantes por curso:", error);
    res.status(500).json({ 
      error: "Error al obtener estudiantes por curso",
      details: error.message
    });
  }
});

// Ruta: obtener lista de cursos
app.get("/cursos", async (req, res) => {
  try {
    const estudiantes = getEstudiantes();
    const cursos = [...new Set(estudiantes.map(e => e.curso))].sort();
    res.json(cursos);
  } catch (error) {
    console.error("❌ Error al obtener cursos:", error);
    res.status(500).json({ 
      error: "Error al obtener cursos",
      details: error.message
    });
  }
});

// Ruta: obtener estudiante por identificador
app.get("/estudiantes/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;
    console.log(`🔍 Buscando estudiante: ${identifier}`);
    
    const estudiante = getEstudianteById(identifier);
    if (estudiante) {
      console.log(`✅ Estudiante encontrado: ${estudiante.name}`);
      res.json(estudiante);
    } else {
      console.log(`❌ Estudiante no encontrado: ${identifier}`);
      res.status(404).json({ error: "Estudiante no encontrado" });
    }
  } catch (error) {
    console.error("❌ Error al buscar estudiante:", error);
    res.status(500).json({ 
      error: "Error al buscar estudiante",
      details: error.message
    });
  }
});

// Ruta: actualizar puntos de un estudiante
app.put("/estudiantes/:identifier/puntos", verifyPassword, async (req, res) => {
  try {
    const { identifier } = req.params;
    const { puntos } = req.body;

    console.log(`🔄 Actualizando puntos del estudiante: ${identifier} a ${puntos}`);

    const updated = updateEstudiantePoints(identifier, puntos);
    if (updated) {
      console.log(`✅ Puntos actualizados correctamente`);
      res.json({ success: true, estudiante: updated });
    } else {
      console.log(`❌ Estudiante no encontrado: ${identifier}`);
      res.status(404).json({ error: "Estudiante no encontrado" });
    }
  } catch (error) {
    console.error("❌ Error al actualizar puntos:", error);
    res.status(500).json({ 
      error: "Error al actualizar puntos",
      details: error.message
    });
  }
});

// Ruta: sumar puntos a un estudiante
app.post("/estudiantes/:identifier/sumar", verifyPassword, async (req, res) => {
  try {
    const { identifier } = req.params;
    const { puntos } = req.body;

    console.log(`🔄 Sumando ${puntos} puntos al estudiante: ${identifier}`);

    if (!puntos || puntos <= 0) {
      return res.status(400).json({ error: "La cantidad de puntos debe ser mayor a 0" });
    }

    const estudiante = getEstudianteById(identifier);
    if (!estudiante) {
      console.log(`❌ Estudiante no encontrado: ${identifier}`);
      return res.status(404).json({ error: "Estudiante no encontrado" });
    }

    const puntosActuales = estudiante.puntos || 0;
    const nuevosPuntos = puntosActuales + parseInt(puntos);

    const updated = updateEstudiantePoints(identifier, nuevosPuntos);
    if (updated) {
      console.log(`✅ Puntos sumados correctamente: ${estudiante.name} (${puntosActuales} → ${nuevosPuntos})`);
      res.json({ success: true, estudiante: updated });
    } else {
      console.log(`❌ Error al actualizar estudiante: ${identifier}`);
      res.status(500).json({ error: "Error al actualizar puntos" });
    }
  } catch (error) {
    console.error("❌ Error al sumar puntos:", error);
    res.status(500).json({ 
      error: "Error al sumar puntos",
      details: error.message
    });
  }
});

// Ruta: restar puntos a un estudiante
app.post("/estudiantes/:identifier/restar", verifyPassword, async (req, res) => {
  try {
    const { identifier } = req.params;
    const { puntos } = req.body;

    console.log(`🔄 Restando ${puntos} puntos al estudiante: ${identifier}`);

    if (!puntos || puntos <= 0) {
      return res.status(400).json({ error: "La cantidad de puntos debe ser mayor a 0" });
    }

    const estudiante = getEstudianteById(identifier);
    if (!estudiante) {
      console.log(`❌ Estudiante no encontrado: ${identifier}`);
      return res.status(404).json({ error: "Estudiante no encontrado" });
    }

    const puntosActuales = estudiante.puntos || 0;
    const nuevosPuntos = puntosActuales - parseInt(puntos);

    const updated = updateEstudiantePoints(identifier, nuevosPuntos);
    if (updated) {
      console.log(`✅ Puntos restados correctamente: ${estudiante.name} (${puntosActuales} → ${nuevosPuntos})`);
      res.json({ success: true, estudiante: updated });
    } else {
      console.log(`❌ Error al actualizar estudiante: ${identifier}`);
      res.status(500).json({ error: "Error al actualizar puntos" });
    }
  } catch (error) {
    console.error("❌ Error al restar puntos:", error);
    res.status(500).json({ 
      error: "Error al restar puntos",
      details: error.message
    });
  }
});

// Ruta para servir el index.html en la raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Ruta para /admin también sirve el index.html (SPA)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Manejo de errores para archivos no encontrados
app.use((req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/estudiantes/') || req.path.startsWith('/ranking/')) {
    res.status(404).json({ error: 'Endpoint no encontrado' });
  } else {
    // Para rutas del frontend, servir index.html (SPA)
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  }
});

// Manejo de errores global
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Manejo de señales para cierre graceful
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🌐 Servidor Express iniciado en http://localhost:${PORT}`);
  console.log(`📊 API disponible en http://localhost:${PORT}/ranking`);
  console.log(`⚡ Admin panel en http://localhost:${PORT}/admin`);
  console.log(`🎮 TITANOMACHY TOURNAMENT - Sistema de gamificación activo`);
});