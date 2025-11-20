// seed.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // carga MONGO_URI

// Conexión a MongoDB
await mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
console.log("Conectado a MongoDB");

// ======= Definir esquemas =======

// Usuarios
const usuarioSchema = new mongoose.Schema({
  nombre: String,
  email: String,
  password: String,
});
const Usuario = mongoose.model("Usuario", usuarioSchema);

// Recetas
const recetaSchema = new mongoose.Schema({
  nombre: String,
  descripcion: String,
  ingredientes: [String],
});
const Receta = mongoose.model("Receta", recetaSchema);

// Favoritas
const favoritaSchema = new mongoose.Schema({
  usuarioId: String,
  recetaId: String,
});
const Favorita = mongoose.model("Favorita", favoritaSchema);

// Seguidores
const seguidorSchema = new mongoose.Schema({
  usuarioId: String,
  sigueAId: String,
});
const Seguidor = mongoose.model("Seguidor", seguidorSchema);

// ======= Crear documentos de prueba =======

await Usuario.create({ nombre: "Juan", email: "juan@mail.com", password: "1234" });
await Receta.create({ nombre: "Tacos", descripcion: "Deliciosos tacos", ingredientes: ["tortilla","carne","salsa"] });
await Favorita.create({ usuarioId: "1", recetaId: "1" });
await Seguidor.create({ usuarioId: "1", sigueAId: "2" });

console.log("Documentos de prueba creados en todas las colecciones.");

// Cerrar conexión
await mongoose.connection.close();
console.log("Conexión cerrada.");
