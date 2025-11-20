import express from 'express';
import multer from "multer";
import {
    registrarUsuario,
    iniciarSesion,
    ModificarPerfil,
} from '../controllers/sesionController.js'; // Controlador para manejar la lógica de registro

// Configuración de multer para guardar fotos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });


const router = express.Router();

// Ruta para ver usuario
router.post('/login', iniciarSesion);    

// Ruta para registrar un nuevo usuario
router.post('/registrar', registrarUsuario); 

router.put('/editarperfil', upload.single("foto"), ModificarPerfil);

console.log("rutas ok");

export default router;
