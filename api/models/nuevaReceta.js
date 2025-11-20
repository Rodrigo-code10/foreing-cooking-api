import mongoose from "mongoose";

const NewRecetaSchema = new mongoose.Schema({
  nombre:{
    type:String,
    required:true,
    trim:true //Quita espacio al inicio
  },
  descripcion:{
    type:String,
    required:true,
    trim:true
  },
  tiempoPreparacion:{
    type:Number,
    required:true,
    min:1
  },
  porciones:{
    type:Number,
    required:true,
    min:1
  },
  dificultad:{
    type:String,
    enum:['Fácil', 'Media', 'Difícil'],
    required:true
  },
  ingredientes:{
    type:[String],
    required:true
  },
  pasos:{
    type:[String],
    required:true
  },
  imagen:{
    type:String, //Guarda la dirección
    required:true
  },
  autor:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Usuario',  //Hace referencia al usuario que subio
    required:true
  },
  fechaCreacion:{
    type:Date,
    default:Date.now
  },
  categoria: {
    type: [String],
    required:true
  },
  calificacion: {
    type:Number,
    default:0
  },
  numCalificaciones: { 
    type:Number, 
    default:0 
  },
  likes: { 
    type:Number, 
    default:0 
  }
});
export const Receta = mongoose.model('Receta', NewRecetaSchema);
