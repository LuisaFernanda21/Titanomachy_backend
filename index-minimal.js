// Servidor mínimo para debug en Railway
const express = require("express");

console.log("🔧 Iniciando servidor mínimo...");

const app = express();
const PORT = process.env.PORT || 3001;

console.log(`🔧 Puerto configurado: ${PORT}`);

// Middleware básico
app.use(express.json());

console.log("✅ Middleware configurado");

// Ruta de prueba simple
app.get("/", (req, res) => {
  res.json({ 
    message: "🏆 TITANOMACHY Backend - Funcionando", 
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.get("/test", (req, res) => {
  res.json({ test: "OK", status: "working" });
});

console.log("✅ Rutas configuradas");

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`✅ Servidor iniciado exitosamente en puerto ${PORT}`);
  console.log(`🌐 Servidor disponible en: http://localhost:${PORT}`);
});

// Manejo de errores del servidor
server.on('error', (error) => {
  console.error('❌ Error del servidor:', error);
  process.exit(1);
});

// Manejo de señales
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

console.log("🎯 Configuración completa - esperando conexiones...");
