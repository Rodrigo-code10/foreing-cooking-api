import mongoose from "mongoose";

const favoritoSchema = new mongoose.Schema({
  userId: {
    type:mongoose.Schema.Types.ObjectId,
    ref:"Usuario",
    required:true
  },
  recetaId: {
    type:mongoose.Schema.Types.ObjectId,
    ref:"Receta",
    required:true
  },
  fecha: {
    type:Date,
    default:Date.now
  }
});

export const Favorito = mongoose.model("Favorito", favoritoSchema);
