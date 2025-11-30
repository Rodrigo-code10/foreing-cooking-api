import express from 'express';
import multer from "multer";
import {
    crearReceta,
    mostrarRecetas,
    obtenerRecetaPorId,
    like,
    eliminarReceta,
    Aprobar,
    Rechazar,
    Pendiente,
    ContarRecetas,
    Ver,
    Editar,
    ImagenRecetas,
} from '../controllers/recetasController.js'; // Controlador para manejar la lógica de las recetas

import {
    verificarToken,
    soloAdmin,
} from '../middleware/auth.js';


import { 
    calificarReceta, 
    obtenerMiCalificacion 
} from '../controllers/recetasController.js';

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

// Ruta para crear una receta
router.post("/newreceta", verificarToken, upload.single("imagen_receta"), crearReceta);   

router.get("/muestrarecetas", mostrarRecetas);

router.get("/imagenrecetas", ImagenRecetas);

router.get("/recetas/:id", obtenerRecetaPorId);

router.post("/recetas/:id/like",verificarToken, like);

router.delete("/rmiRecetas/:id",verificarToken,eliminarReceta);

// Calificar una receta
router.post("/recetas/:id/calificar", verificarToken, calificarReceta);

// Obtener mi calificación de una receta
router.get("/recetas/:id/mi-calificacion", verificarToken, obtenerMiCalificacion);

router.get('/MisRecetas/:id/Ver',verificarToken, Ver);

router.put('/MisRecetas/:id/Editar',verificarToken, Editar);

//Panel Administrativo

router.put('/recetas/:id/aprobar',verificarToken, soloAdmin, Aprobar);

router.put('/recetas/:id/rechazar',verificarToken, soloAdmin, Rechazar);

router.get('/recetas/:id/ver',verificarToken, soloAdmin, Ver);

router.put('/recetas/:id/editar',verificarToken,soloAdmin, Editar);

router.get('/pendiente',verificarToken, soloAdmin, Pendiente)

router.get('/CuentaRecetas',verificarToken, soloAdmin, ContarRecetas)

console.log("rutas ok");

export default router;
