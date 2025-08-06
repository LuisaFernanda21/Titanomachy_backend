// estudiantes.js

const fs = require("fs");

// Función para cargar datos desde estudiantes.json
function loadEstudiantesFromFile() {
  try {
    const data = fs.readFileSync("./estudiantes.json", "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("❌ Error al cargar estudiantes:", err.message);
    return [];
  }
}

// Cargar datos iniciales
let estudiantes = loadEstudiantesFromFile();
console.log("✅ Estudiantes cargados correctamente desde estudiantes.json");

// Obtener todos los estudiantes (siempre recarga del archivo)
function getEstudiantes() {
  estudiantes = loadEstudiantesFromFile();
  return estudiantes;
}

// Obtener estudiante por nombre o índice
function getEstudianteById(identifier) {
  const currentEstudiantes = loadEstudiantesFromFile();
  
  // Si es un número, usar como índice
  if (!isNaN(identifier)) {
    const idx = parseInt(identifier) - 1;
    return currentEstudiantes[idx] || null;
  }
  
  // Si contiene "+", es una combinación nombre+curso
  if (identifier.includes('+')) {
    const [nombre, curso] = identifier.split('+');
    return currentEstudiantes.find(est => 
      est.name === nombre && est.curso === curso
    ) || null;
  }
  
  // Si es texto simple, buscar por nombre
  return currentEstudiantes.find(est => est.name.toLowerCase().includes(identifier.toLowerCase())) || null;
}

// Actualizar puntos de un estudiante por índice o nombre
function updateEstudiantePoints(identifier, newPoints) {
  console.log(`🔍 Buscando estudiante con identificador: "${identifier}"`);
  
  // Cargar datos actuales del archivo
  estudiantes = loadEstudiantesFromFile();
  
  let estudiante = null;
  let idx = -1;
  
  // Si es un número, usar como índice
  if (!isNaN(identifier)) {
    idx = parseInt(identifier) - 1;
    estudiante = estudiantes[idx];
    console.log(`📍 Búsqueda por índice: ${idx}, encontrado: ${estudiante ? estudiante.name : 'No encontrado'}`);
  } else if (identifier.includes('+')) {
    // Si contiene "+", es una combinación nombre+curso
    const [nombre, curso] = identifier.split('+');
    console.log(`📍 Búsqueda por nombre+curso: "${nombre}" en curso "${curso}"`);
    idx = estudiantes.findIndex(est => est.name === nombre && est.curso === curso);
    estudiante = estudiantes[idx];
    console.log(`📍 Resultado: ${estudiante ? `Encontrado ${estudiante.name} en ${estudiante.curso}` : 'No encontrado'}`);
  } else {
    // Si es texto simple, buscar por nombre
    console.log(`📍 Búsqueda por nombre: "${identifier}"`);
    idx = estudiantes.findIndex(est => est.name.toLowerCase().includes(identifier.toLowerCase()));
    estudiante = estudiantes[idx];
    console.log(`📍 Resultado: ${estudiante ? estudiante.name : 'No encontrado'}`);
  }
  
  if (estudiante && idx >= 0) {
    const puntosAnteriores = estudiantes[idx].puntos;
    estudiantes[idx].puntos = newPoints;
    console.log(`✅ Puntos actualizados: ${estudiante.name} (${puntosAnteriores} → ${newPoints})`);
    
    // Guardar cambios en el archivo
    try {
      fs.writeFileSync("./estudiantes.json", JSON.stringify(estudiantes, null, 2));
      console.log(`💾 Cambios guardados en archivo para ${estudiante.name}`);
    } catch (err) {
      console.error("❌ Error al guardar cambios:", err.message);
    }
    return estudiantes[idx];
  }
  
  console.log(`❌ No se pudo encontrar estudiante con identificador: "${identifier}"`);
  return null;
}

// Obtener ranking ordenado por puntos descendente
function getRanking() {
  const currentEstudiantes = loadEstudiantesFromFile();
  return [...currentEstudiantes].sort((a, b) => (b.puntos || 0) - (a.puntos || 0));
}

// Obtener estudiantes por curso
function getEstudiantesByCurso(curso) {
  const currentEstudiantes = loadEstudiantesFromFile();
  return currentEstudiantes.filter((est) => est.curso === curso);
}

// Buscar estudiante por nombre
function findEstudianteByName(nombre) {
  const currentEstudiantes = loadEstudiantesFromFile();
  return currentEstudiantes.filter(est => 
    est.name.toLowerCase().includes(nombre.toLowerCase())
  );
}

module.exports = {
  getEstudiantes,
  getEstudianteById,
  updateEstudiantePoints,
  getRanking,
  getEstudiantesByCurso,
  findEstudianteByName,
};
