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
const PASSWORD = process.env.ADMIN_PASSWORD || "torneo2025";
const NODE_ENV = process.env.NODE_ENV || "development";

console.log("🚀 Iniciando servidor TITANOMACHY...");
console.log(`🌍 Entorno: ${NODE_ENV}`);

// Middleware
app.use(cors({
  origin: NODE_ENV === "production" 
    ? [
        "https://titanomachybackend-production.up.railway.app",
        /\.railway\.app$/,
        /\.vercel\.app$/,
        /localhost:\d+$/
      ]
    : true,
  credentials: true
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for Railway/Vercel
app.set('trust proxy', 1);

// Configurar para servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend'), {
  maxAge: NODE_ENV === "production" ? '1d' : 0,
  etag: true
}));

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
    console.log(`❌ Intento de acceso con contraseña incorrecta desde IP: ${req.ip}`);
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
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    students_loaded: estudiantes.length,
    port: PORT,
    version: "1.0.0"
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
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/estudiantes/') || req.path.startsWith('/ranking/')) {
    res.status(404).json({ error: 'Endpoint no encontrado' });
  } else {
    // Para rutas del frontend, servir index.html (SPA)
    res.sendFile(path.join(__dirname, '../frontend/index.html'), (err) => {
      if (err) {
        console.error('❌ Error serving index.html:', err);
        res.status(500).send('Error interno del servidor');
      }
    });
  }
});

// Manejo de errores global mejorado
app.use((error, req, res, next) => {
  console.error('❌ Error handler:', error);
  res.status(500).json({
    error: NODE_ENV === "production" ? "Error interno del servidor" : error.message,
    timestamp: new Date().toISOString()
  });
});

// Manejo de señales para cierre graceful
let server;

const gracefulShutdown = (signal) => {
  console.log(`🛑 ${signal} received, shutting down gracefully`);
  if (server) {
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.log('❌ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Iniciar servidor
server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Servidor Express iniciado en puerto ${PORT}`);
  console.log(`📊 API disponible en /ranking`);
  console.log(`⚡ Admin panel en /admin`);
  console.log(`🎮 TITANOMACHY TOURNAMENT - Sistema de gamificación activo`);
  console.log(`🌍 Entorno: ${NODE_ENV}`);
  
  if (NODE_ENV === "development") {
    console.log(`🔗 Local: http://localhost:${PORT}`);
  }
});

// Handle server startup errors
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  switch (error.code) {
    case 'EACCES':
      console.error(`❌ Puerto ${PORT} requiere privilegios elevados`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`❌ Puerto ${PORT} ya está en uso`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});