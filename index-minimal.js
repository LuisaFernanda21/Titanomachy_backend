// Servidor ultra-mínimo para Railway
const http = require('http');

console.log('� Iniciando servidor HTTP nativo...');

const PORT = process.env.PORT || 3001;
console.log(`🔧 Puerto: ${PORT}`);

const server = http.createServer((req, res) => {
  console.log(`📝 Request: ${req.method} ${req.url}`);
  
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      message: '🏆 TITANOMACHY Backend funcionando',
      status: 'OK',
      port: PORT,
      timestamp: new Date().toISOString()
    }));
  } else if (req.url === '/test') {
    res.writeHead(200);
    res.end(JSON.stringify({ test: 'OK', working: true }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`✅ Servidor HTTP iniciado en puerto ${PORT}`);
  console.log(`🌐 Disponible en: http://localhost:${PORT}`);
});

server.on('error', (error) => {
  console.error('❌ Error del servidor:', error);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM - Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
});

console.log('🎯 Servidor configurado - esperando requests...');
