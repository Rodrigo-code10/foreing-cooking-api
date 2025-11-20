import { Receta } from "../models/nuevaReceta.js";
import { Usuario } from "../models/usuario.js";
import { Favorito } from "../models/favoritos.js";
import { Calificacion } from "../models/calificacion.js";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET

export async function crearReceta(req,res) {
    try {

        if (!req.body.nombre_receta || !req.body.descripcion) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const usuario = await Usuario.findById(req.usuarioId);

        const nuevaReceta = new Receta({
            nombre: req.body.nombre_receta,
            descripcion: req.body.descripcion,
            tiempoPreparacion: req.body.tiempo_preparacion, 
            porciones: req.body.porciones,
            dificultad: req.body.dificultad, 
            ingredientes: req.body.ingredientes.split('\n'), 
            pasos: req.body.pasos.split('\n'),
            imagen: req.file ? `/uploads/${req.file.filename}` : null,
            autor: req.usuarioId,
            categoria: req.body.categoria 
        });

        await nuevaReceta.save();

        res.status(201).json({
            mensaje: 'Receta creada exitosamente',
            receta: nuevaReceta
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear receta', detalle: error.message });
    }  
}


export function verificarToken(req, res, next) {
    const header = req.headers['authorization'];

    if (!header) {
        return res.status(401).json({ error: "Token no proporcionado" });
    }

    const [bearer, token] = header.split(" ");

    if (bearer !== "Bearer" || !token) {
        return res.status(401).json({ error: "Formato de token inválido" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuarioId = decoded.id;
        next(); 
    } catch (error) {
        res.status(403).json({ error: "Token inválido o expirado" });
    }
}


export async function mostrarRecetas(req, res) {
    try {
        // Obtenemos los filtros desde query params
        const filtros = {};

        if (req.query.autor) {
            filtros.autor = req.query.autor;
        }

        if (req.query.nombre) {
            filtros.nombre = { $regex: req.query.nombre, $options: "i" };
        }

        if (req.query.categoria) {
            filtros.categoria = req.query.categoria;
        }
        if (req.query.ingrediente) {
            filtros.ingredientes = { $in: [req.query.ingrediente] }; 
        }

        const recetas = await Receta.find(filtros)
            .populate('autor', 'nombre');

        res.json(recetas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener recetas" });
    }
}


export async function like(req, res) {
    try {
        const receta = await Receta.findById(req.params.id);
        if (!receta) return res.status(404).json({ error: "Receta no encontrada" });
        if (receta.autor == req.usuarioId) return res.json({ mensaje: "No te puedes dar like a ti mismo",likes:receta.likes});

        const existeFavorito = await Favorito.findOne({
            userId: req.usuarioId, 
            recetaId: receta._id
        });

        if (existeFavorito) {
            // Quitar like
            await existeFavorito.deleteOne();
            receta.likes = Math.max(0, receta.likes - 1);
            await receta.save();
            return res.json({ mensaje: "Like eliminado", likes: receta.likes });
        } else {
            // Dar like
            await Favorito.create({ userId: req.usuarioId,  recetaId: receta._id});
            receta.likes = receta.likes + 1;
            await receta.save();
            return res.json({ mensaje: "Like agregado", likes: receta.likes });
        }

    } catch (error) {
        res.status(500).json({ error: "Error al dar like", detalle: error.message });
    }
}
  
export async function eliminarReceta(req, res) {
    try {
        const receta = await Receta.findById(req.params.id);
        
        if (!receta) {
            return res.status(404).json({ error: 'Receta no encontrada' });
        }

        // Verificar que el usuario es el autor
        if (receta.autor.toString() !== req.usuarioId) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar esta receta' });
        }

        await Favorito.deleteMany({ recetaId: receta._id });

        await Receta.findByIdAndDelete(req.params.id);

        res.json({ mensaje: 'Receta eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar receta', detalle: error.message });
    }
}

// Obtener una receta específica por ID
export const obtenerRecetaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validar que el ID sea válido (formato MongoDB ObjectId)
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'ID de receta inválido' });
        }

        // Buscar la receta y popular el autor
        const receta = await Receta.findById(id).populate('autor', 'nombre foto');
        
        if (!receta) {
            return res.status(404).json({ error: 'Receta no encontrada' });
        }

        res.json(receta);
    } catch (error) {
        console.error('Error al obtener receta:', error);
        res.status(500).json({ error: 'Error del servidor al obtener receta' });
    }
};



// Calificar una receta
export async function calificarReceta(req, res) {
    try {
        const recetaId = req.params.id;
        const { puntuacion } = req.body;
        const usuarioId = req.usuarioId;

        // Validar puntuación
        if (!puntuacion || puntuacion < 1 || puntuacion > 5) {
            return res.status(400).json({ error: 'La puntuación debe estar entre 1 y 5' });
        }

        // Verificar que la receta existe
        const receta = await Receta.findById(recetaId);
        if (!receta) {
            return res.status(404).json({ error: 'Receta no encontrada' });
        }

        // Verificar que no está calificando su propia receta
        if (receta.autor.toString() === usuarioId) {
            return res.status(400).json({ error: 'No puedes calificar tu propia receta' });
        }

        // Buscar si ya calificó antes
        let calificacion = await Calificacion.findOne({ 
            recetaId: recetaId, 
            usuarioId: usuarioId 
        });

        if (calificacion) {
            // Actualizar calificación existente
            calificacion.puntuacion = puntuacion;
            await calificacion.save();
        } else {
            // Crear nueva calificación
            calificacion = await Calificacion.create({
                recetaId: recetaId,
                usuarioId: usuarioId,
                puntuacion: puntuacion
            });
        }

        // Recalcular promedio de calificaciones
        const todasCalificaciones = await Calificacion.find({ recetaId: recetaId });
        const suma = todasCalificaciones.reduce((acc, cal) => acc + cal.puntuacion, 0);
        const promedio = suma / todasCalificaciones.length;

        // Actualizar receta
        receta.calificacion = Math.round(promedio * 10) / 10; // Redondear a 1 decimal
        receta.numCalificaciones = todasCalificaciones.length;
        await receta.save();

        res.json({
            mensaje: 'Calificación guardada exitosamente',
            calificacion: receta.calificacion,
            numCalificaciones: receta.numCalificaciones,
            tuCalificacion: puntuacion
        });

    } catch (error) {
        console.error('Error al calificar receta:', error);
        res.status(500).json({ error: 'Error al calificar receta', detalle: error.message });
    }
}

// Obtener la calificación del usuario actual para una receta
export async function obtenerMiCalificacion(req, res) {
    try {
        const recetaId = req.params.id;
        const usuarioId = req.usuarioId;

        const calificacion = await Calificacion.findOne({
            recetaId: recetaId,
            usuarioId: usuarioId
        });

        if (calificacion) {
            res.json({ puntuacion: calificacion.puntuacion });
        } else {
            res.json({ puntuacion: 0 });
        }

    } catch (error) {
        console.error('Error al obtener calificación:', error);
        res.status(500).json({ error: 'Error al obtener calificación' });
    }
}