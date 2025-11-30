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
  ingredientes: [{
    nombre: { type: String, required: true },   
    cantidad: { type: Number, default: null }, 
    unidad: { type: String, default: null },   
    texto: { type: String, required: true }     
  }],
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
  },
  estado: {
    type: String,
    enum: ['pendiente', 'aprobada', 'rechazada'],
    default: 'pendiente'
  }
});

export function parseIngrediente(linea) {
  const original = linea.trim();

  const sinAcentos = original
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const partes = sinAcentos.split(" ");

  // Cantidad si hay número al inicio
  let cantidad = null;
  if (!isNaN(partes[0])) {
      cantidad = Number(partes.shift());
  }

  // Unidad reconocida
  const unidades = ["taza","tazas","cucharada","cucharadas","gramo","gramos","kg","ml","pieza","piezas"];
  let unidad = null;
  if (partes.length && unidades.includes(partes[0])) {
      unidad = partes.shift();
  }

  const nombre = partes.join(" ").trim();
  return { nombre, cantidad, unidad, texto: original };
}

NewRecetaSchema.pre('save', function(next) {
  if (this.ingredientes && Array.isArray(this.ingredientes)) {
    this.ingredientes = this.ingredientes.map(i => {
      if (typeof i === 'string') return parseIngrediente(i);
      return i; // si ya es objeto, no tocarlo
    });
  }

  // Limpiar pasos y categorías
  const limpiar = arr => arr.map(i => i.trim()).filter(i => i.length > 0);
  this.pasos = limpiar(this.pasos || []);
  this.categoria = limpiar(this.categoria || []);

  next();
});

export const Receta = mongoose.model('Receta', NewRecetaSchema);