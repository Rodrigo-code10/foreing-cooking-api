import mongoose from "mongoose";

const calificacionSchema = new mongoose.Schema({
    recetaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Receta',
        required: true
    },
    usuarioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    puntuacion: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    fecha: {
        type: Date,
        default: Date.now
    }
});

calificacionSchema.index({ recetaId: 1, usuarioId: 1 }, { unique: true });

export const Calificacion = mongoose.model('Calificacion', calificacionSchema);