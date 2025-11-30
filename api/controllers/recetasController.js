import { Receta, parseIngrediente } from "../models/nuevaReceta.js";
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

        let ingredientesArray = [];
        if (req.body.ingredientes) {
          if (Array.isArray(req.body.ingredientes)) {
            ingredientesArray = req.body.ingredientes;
          } else {
            ingredientesArray = req.body.ingredientes.split('\n');
          }
          ingredientesArray = ingredientesArray
            .map(i => i.trim())
            .filter(i => i.length > 0)
            .map(parseIngrediente);
        }

        const usuario = await Usuario.findById(req.usuarioId);        
        const nuevaReceta = new Receta({
            nombre: req.body.nombre_receta,
            descripcion: req.body.descripcion,
            tiempoPreparacion: req.body.tiempo_preparacion, 
            porciones: req.body.porciones,
            dificultad: req.body.dificultad, 
            ingredientes: ingredientesArray,
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





export async function mostrarRecetas(req, res) {
    try {
        // Obtenemos los filtros desde query params
        const filtros = {};

        filtros.estado = "aprobada";

        if (req.query.autor) {
            filtros.autor = req.query.autor;
        }

        if (req.query.nombre) {
            filtros.nombre = { $regex: req.query.nombre, $options: "i" };
        }

        if (req.query.categoria) {
            const categorias = Array.isArray(req.query.categoria)
                ? req.query.categoria
                : req.query.categoria.split(',');
            filtros.categoria = { $all: categorias};
        }
        
        if (req.query.ingredientes) {
            const ingredientes = Array.isArray(req.query.ingredientes)
                ? req.query.ingredientes
                : req.query.ingredientes.split(',');
        
            const regexIngredientes = ingredientes.map(ing => {
                const base = ing.trim()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "");
                return new RegExp(`^${base}(es|s)?$`, "i");
            });
        
            filtros["ingredientes.nombre"] = { $all: regexIngredientes };
        }
        let orden = {};

        switch (req.query.orden) {
            case "viejas":
                orden = { fechaCreacion: 1 }; //De las mas antiguas
                break;
            case "top":
                orden = { calificacion: -1 }; //Mejores Calificacion
                break;
            default:
                orden = { fechaCreacion: -1 }; //Recientes
        }

        let query = Receta.find(filtros).populate('autor', 'nombre').sort(orden);

        if (req.query.limit) {
            const limit = parseInt(req.query.limit);
            if (!isNaN(limit) && limit > 0) { //Verifia sino muestra todas 
                query = query.limit(limit);
            }
        }

        const recetas = await query;
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
  
export async function Aprobar(req, res){
    try {
      const receta = await Receta.findByIdAndUpdate(
        req.params.id,
        { estado: 'aprobada' },
        { new: true }   //Devuleve el documento nuevo
      );
      res.json(receta);
    } catch (err) {
      res.status(500).json({ error: 'Error al aprobar receta' });
    }
}

export async function Rechazar(req, res){
    try {
        const receta = await Receta.findByIdAndUpdate(
          req.params.id,
          { estado: 'rechazada' },
          { new: true }
        );
        res.json(receta);
      } catch (err) {
        res.status(500).json({ error: 'Error al rechazar receta' });
      }
}

export async function Pendiente(req, res) {
    try {
      const recetas = await Receta.find({ estado: 'pendiente' }).populate('autor', ['nombre', 'email']);
      res.json(recetas);
    } catch (err) {
      console.error("Error en Pendiente:", err);
      res.status(500).json({ error: "Error obteniendo recetas pendientes" });
    }
}

export async function ContarRecetas(req, res) {
    try {
        // Agrupo por estado
        const porEstado = await Receta.aggregate([
            {
                $group: {
                    _id: "$estado",
                    total: { $sum: 1 }
                }
            }
        ]);

        const total = await Receta.countDocuments(); //General
        const respuesta = {
            total,
            pendiente: porEstado.find(x => x._id === "pendiente")?.total || 0,
            aprobada: porEstado.find(x => x._id === "aprobada")?.total || 0,
            rechazada: porEstado.find(x => x._id === "rechazada")?.total || 0,
        };

        res.json(respuesta);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error contando las recetas" });
    }
}

export async function Ver(req, res) {
    try {
      const receta = await Receta.findById(req.params.id).populate('autor', 'nombre');
      if (!receta) return res.status(404).json({ error: "Receta no encontrada" });
      res.json(receta);
    } catch (err) {
      res.status(500).json({ error: "Error obteniendo receta" });
    }
}

export async function Editar(req, res) {
  try {
    const receta = await Receta.findByIdAndUpdate(
      req.params.id,
      req.body,      // body debe contener solo los campos que quieres editar
      { new: true }  
    );
    if (!receta) return res.status(404).json({ error: "Receta no encontrada" });
    res.json(receta);
  } catch (err) {
    res.status(500).json({ error: "Error editando receta" });
  }
}

export async function ImagenRecetas(req, res) {
    try {
        const cantidad = Number(req.query.cantidad) || 10;

        const recetas = await Receta.find({estado: "aprobada"}, "imagen")   
            .sort({ fechaCreacion: -1 })                  
            .limit(cantidad);                             

        res.json(recetas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener recetas" });
    }
}