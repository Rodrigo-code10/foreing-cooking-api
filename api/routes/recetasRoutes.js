import express from 'express';
import multer from "multer";
import {
    verificarToken,
    crearReceta,
    mostrarRecetas,
    obtenerRecetaPorId,
    like,
    eliminarReceta,
} from '../controllers/recetasController.js'; // Controlador para manejar la lógica de las recetas

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

router.get("/recetas/:id", obtenerRecetaPorId);

router.post("/recetas/:id/like",verificarToken, like);

router.delete("/rmiRecetas/:id",verificarToken,eliminarReceta);


import { 
    calificarReceta, 
    obtenerMiCalificacion 
} from '../controllers/recetasController.js';

// Calificar una receta
router.post("/recetas/:id/calificar", verificarToken, calificarReceta);

// Obtener mi calificación de una receta
router.get("/recetas/:id/mi-calificacion", verificarToken, obtenerMiCalificacion);



console.log("rutas ok");

export default router;
