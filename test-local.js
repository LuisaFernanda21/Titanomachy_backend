// Test local para verificar que las funciones funcionan
const { getRanking, getEstudiantes } = require("./estudiantes");

console.log("🧪 Probando funciones localmente...");

try {
  console.log("📊 Probando getRanking():");
  const ranking = getRanking();
  console.log(`✅ Ranking obtenido - ${ranking.length} estudiantes`);
  console.log("Top 3:", ranking.slice(0, 3));
  
  console.log("\n👥 Probando getEstudiantes():");
  const estudiantes = getEstudiantes();
  console.log(`✅ Estudiantes obtenidos - ${estudiantes.length} estudiantes`);
  
  console.log("\n🎉 Todas las funciones funcionan correctamente!");
} catch (error) {
  console.error("❌ Error:", error);
}
