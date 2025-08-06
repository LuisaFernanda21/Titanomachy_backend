const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// Log de inicio
console.log("🚀 Iniciando servidor TITANOMACHY...");

const {
  getEstudiantes,
  getEstudianteById,
  updateEstudiantePoints,
  getRanking,
  getEstudiantesByCurso,
  findEstudianteByName
} = require("./estudiantes");

console.log("✅ Módulos importados correctamente");

const app = express();
const PORT = process.env.PORT || 3001;

// Contraseña para gestionar puntos
const ADMIN_PASSWORD = "torneo2025";

console.log(`🔧 Configurando servidor en puerto ${PORT}`);

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Servir archivos estáticos del frontend - DESHABILITADO para Railway
// app.use(express.static(path.join(__dirname, '../frontend')));

// Middleware para verificar contraseña en rutas protegidas
const verifyPassword = (req, res, next) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Contraseña incorrecta" });
  }
  next();
};

// Ruta principal de prueba - API Status
app.get("/", (req, res) => {
  res.json({ 
    message: "🏆 TITANOMACHY Backend API", 
    status: "✅ Funcionando correctamente",
    version: "1.0.0",
    endpoints: [
      "GET /ranking - Obtener ranking de estudiantes",
      "GET /estudiantes - Obtener todos los estudiantes", 
      "GET /estudiantes/:id - Obtener estudiante por ID",
      "GET /ranking/cursos-total - Ranking por cursos",
      "GET /ranking/curso/:curso - Ranking de un curso específico",
      "POST /sumar-puntos - Sumar puntos (requiere password)",
      "POST /restar-puntos - Restar puntos (requiere password)"
    ]
  });
});

// Ruta de salud para verificar que el servidor funciona
app.get("/health", (req, res) => {
  res.json({ 
    status: "✅ Servidor funcionando",
    timestamp: new Date().toISOString(),
    message: "Backend TITANOMACHY está operativo"
  });
});

// Ruta para verificar archivos (debug)
app.get("/debug", (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const estudiantesPath = path.join(__dirname, 'estudiantes.json');
    const estudiantesJsPath = path.join(__dirname, 'estudiantes.js');
    
    res.json({
      message: "🔍 Debug de archivos",
      files: {
        "estudiantes.json": fs.existsSync(estudiantesPath) ? "✅ Existe" : "❌ No existe",
        "estudiantes.js": fs.existsSync(estudiantesJsPath) ? "✅ Existe" : "❌ No existe"
      },
      paths: {
        __dirname,
        estudiantesPath,
        estudiantesJsPath
      }
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// Ruta: obtener el ranking de estudiantes (usando archivo JSON)
app.get("/ranking", async (req, res) => {
  try {
    console.log("📊 Solicitando ranking...");
    const rankingLocal = getRanking();
    console.log(`✅ Ranking obtenido: ${rankingLocal.length} estudiantes`);
    res.json(rankingLocal);
  } catch (error) {
    console.error("❌ Error al obtener el ranking:", error);
    res.status(500).json({ 
      error: "Error al obtener el ranking",
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});


// Ruta: obtener todos los estudiantes (usando archivo JSON)
app.get("/estudiantes", async (req, res) => {
  try {
    // Usar solo el archivo JSON para consistencia
    const estudiantesLocal = getEstudiantes();
    res.json(estudiantesLocal);
  } catch (error) {
    console.error("❌ Error al obtener estudiantes:", error);
    res.status(500).json({ error: "Error al obtener estudiantes" });
  }
});

// Ruta: obtener estudiante por ID (índice) o nombre
app.get("/estudiantes/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;
    console.log(`🔍 Buscando estudiante: ${identifier}`);
    
    // Buscar en archivo JSON local
    const estudiante = getEstudianteById(identifier);
    if (estudiante) {
      console.log(`✅ Estudiante encontrado: ${estudiante.name}`);
      res.json(estudiante);
    } else {
      console.log(`❌ Estudiante no encontrado: ${identifier}`);
      res.status(404).json({ error: "Estudiante no encontrado" });
    }
  } catch (error) {
    console.error("❌ Error al obtener estudiante:", error);
    res.status(500).json({ error: "Error al obtener estudiante" });
  }
});

// Ruta: actualizar puntos de un estudiante (con autenticación)
app.put("/estudiantes/:identifier/puntos", verifyPassword, async (req, res) => {
  try {
    const { identifier } = req.params;
    const { puntos } = req.body;
    console.log(`🔄 Actualizando puntos de ${identifier} a ${puntos}`);

    // Usar archivo JSON local únicamente
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
      return res.status(400).json({ error: "Los puntos deben ser un número positivo" });
    }

    // Obtener estudiante actual directamente del archivo JSON
    const estudianteActual = getEstudianteById(identifier);

    if (!estudianteActual) {
      console.log(`❌ Estudiante no encontrado: ${identifier}`);
      return res.status(404).json({ error: "Estudiante no encontrado" });
    }

    const puntosAnteriores = estudianteActual.puntos || 0;
    const nuevoPuntaje = puntosAnteriores + puntos;

    console.log(`📊 ${estudianteActual.name}: ${puntosAnteriores} + ${puntos} = ${nuevoPuntaje}`);

    // Actualizar puntos usando solo el archivo JSON
    const updated = updateEstudiantePoints(identifier, nuevoPuntaje);
    if (updated) {
      console.log(`✅ Puntos actualizados: ${updated.name} (${puntosAnteriores} → ${updated.puntos})`);
      res.json({ success: true, estudiante: updated, puntosAgregados: puntos });
    } else {
      console.log(`❌ Error al actualizar puntos para: ${identifier}`);
      res.status(500).json({ error: "Error al actualizar puntos" });
    }
  } catch (error) {
    console.error("❌ Error al sumar puntos:", error);
    res.status(500).json({ error: "Error al sumar puntos" });
  }
});

// Ruta: restar puntos a un estudiante
app.post("/estudiantes/:identifier/restar", verifyPassword, async (req, res) => {
  try {
    const { identifier } = req.params;
    const { puntos } = req.body;

    console.log(`🔄 Restando ${puntos} puntos al estudiante: ${identifier}`);

    if (!puntos || puntos <= 0) {
      return res.status(400).json({ error: "Los puntos deben ser un número positivo" });
    }

    // Obtener estudiante actual directamente del archivo JSON
    const estudianteActual = getEstudianteById(identifier);

    if (!estudianteActual) {
      console.log(`❌ Estudiante no encontrado: ${identifier}`);
      return res.status(404).json({ error: "Estudiante no encontrado" });
    }

    const puntosAnteriores = estudianteActual.puntos || 0;
    const nuevoPuntaje = puntosAnteriores - puntos; // Permitir puntos negativos

    console.log(`📊 ${estudianteActual.name}: ${puntosAnteriores} - ${puntos} = ${nuevoPuntaje}`);

    // Actualizar puntos usando solo el archivo JSON
    const updated = updateEstudiantePoints(identifier, nuevoPuntaje);
    if (updated) {
      console.log(`✅ Puntos actualizados: ${updated.name} (${puntosAnteriores} → ${updated.puntos})`);
      res.json({ success: true, estudiante: updated, puntosRestados: puntos });
    } else {
      console.log(`❌ Error al actualizar puntos para: ${identifier}`);
      res.status(500).json({ error: "Error al actualizar puntos" });
    }
  } catch (error) {
    console.error("❌ Error al restar puntos:", error);
    res.status(500).json({ error: "Error al restar puntos" });
  }
});

// Ruta: buscar estudiantes por nombre
app.get("/buscar/:nombre", (req, res) => {
  try {
    const { nombre } = req.params;
    const estudiantes = getEstudiantes();
    const resultados = estudiantes.filter(est => 
      est.name.toLowerCase().includes(nombre.toLowerCase())
    );
    res.json(resultados);
  } catch (error) {
    console.error("❌ Error al buscar estudiantes:", error);
    res.status(500).json({ error: "Error al buscar estudiantes" });
  }
});

// Ruta: verificar contraseña
app.post("/auth/verify", (req, res) => {
  const { password } = req.body;
  if (password === "torneo2025") {
    res.json({ valid: true, message: "Contraseña correcta" });
  } else {
    res.status(401).json({ valid: false, message: "Contraseña incorrecta" });
  }
});

// Ruta: obtener estudiantes por curso
app.get("/curso/:curso", (req, res) => {
  try {
    const { curso } = req.params;
    const estudiantes = getEstudiantesByCurso(curso);
    res.json(estudiantes);
  } catch (error) {
    console.error("❌ Error al obtener estudiantes por curso:", error);
    res.status(500).json({ error: "Error al obtener estudiantes por curso" });
  }
});

// Ruta: obtener ranking por curso específico (usando archivo JSON)
app.get("/ranking/curso/:curso", async (req, res) => {
  try {
    const { curso } = req.params;
    
    // Usar solo el archivo JSON para consistencia
    const estudiantesLocal = getEstudiantesByCurso(curso);
    const rankingLocal = estudiantesLocal.sort((a, b) => (b.puntos || 0) - (a.puntos || 0));
    res.json(rankingLocal);
  } catch (error) {
    console.error("❌ Error al obtener ranking por curso:", error);
    res.status(500).json({ error: "Error al obtener ranking por curso" });
  }
});

// Ruta: obtener ranking de cursos por total de puntos (usando archivo JSON)
app.get("/ranking/cursos-total", async (req, res) => {
  try {
    // Usar solo el archivo JSON para consistencia
    const estudiantesLocal = getEstudiantes();
    
    // Agrupar por curso y calcular totales
    const cursoStats = {};
    estudiantesLocal.forEach(estudiante => {
      const curso = estudiante.curso;
      if (!cursoStats[curso]) {
        cursoStats[curso] = {
          curso: curso,
          total_estudiantes: 0,
          total_puntos: 0
        };
      }
      cursoStats[curso].total_estudiantes++;
      cursoStats[curso].total_puntos += (estudiante.puntos || 0);
    });
    
    // Convertir a array, calcular promedio y ordenar
    const rankingCursos = Object.values(cursoStats)
      .map(curso => ({
        ...curso,
        promedio_puntos: parseFloat((curso.total_puntos / curso.total_estudiantes).toFixed(1))
      }))
      .sort((a, b) => b.total_puntos - a.total_puntos);
    
    res.json(rankingCursos);
  } catch (error) {
    console.error("❌ Error al obtener ranking de cursos:", error);
    res.status(500).json({ error: "Error al obtener ranking de cursos" });
  }
});

// Ruta: obtener todos los cursos disponibles (usando archivo JSON)
app.get("/cursos", async (req, res) => {
  try {
    // Usar solo el archivo JSON para consistencia
    const estudiantes = getEstudiantes();
    const cursosUnicos = [...new Set(estudiantes.map(est => est.curso))].sort();
    res.json(cursosUnicos);
  } catch (error) {
    console.error("❌ Error al obtener cursos:", error);
    res.status(500).json({ error: "Error al obtener cursos" });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor backend iniciado en puerto ${PORT}`);
  console.log("📊 Sistema de gamificación TITANOMACHY iniciado");
  console.log("🔗 Rutas disponibles:");
  console.log("   GET /ranking - Obtener ranking de estudiantes");
  console.log("   GET /estudiantes - Obtener todos los estudiantes");
  console.log("   GET /estudiantes/:id - Obtener estudiante por ID");
  console.log("   PUT /estudiantes/:id/puntos - Actualizar puntos (requiere contraseña)");
  console.log("   POST /estudiantes/:id/sumar - Sumar puntos (requiere contraseña)");
  console.log("   POST /estudiantes/:id/restar - Restar puntos (requiere contraseña)");
  console.log("   GET /curso/:curso - Obtener estudiantes por curso");
  console.log("   GET /ranking/curso/:curso - Obtener ranking por curso específico");
  console.log("   GET /ranking/cursos-total - Obtener ranking de cursos por total de puntos");
  console.log("   GET /cursos - Obtener lista de todos los cursos");
  console.log("   GET /buscar/:nombre - Buscar estudiantes por nombre");
  console.log("   POST /auth/verify - Verificar contraseña");
  console.log("🔐 Contraseña de administrador: torneo2025");
});

// Manejo de errores global
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  process.exit(1);
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
  process.exit(0);
});
