import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  rol: { type: String, enum: ["usuario", "admin"], default: "usuario" },
  foto:{ type:String, default: "/default/SinFoto.png"},
  status: { type:String },
  fechaRegistro: { type: Date, default: Date.now }
});

export const Usuario = mongoose.model("Usuario", usuarioSchema);
