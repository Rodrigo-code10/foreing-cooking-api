import express from 'express';
import multer from "multer";
import {
    registrarUsuario,
    iniciarSesion,
    ModificarPerfil,
    TotalUsuarios,
    BuscarUsuario,
    EstadoPerfil,
} from '../controllers/sesionController.js'; // Controlador para manejar la lógica de registro

import {
    verificarToken,
    soloAdmin,
} from '../middleware/auth.js'; 

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

router.put('/editarperfil', verificarToken,upload.single("foto"), ModificarPerfil);

router.get('/BuscarUsuario',verificarToken, BuscarUsuario);

//Panel  Administrativo
router.put('/usuario/:id/Estado',verificarToken, soloAdmin, EstadoPerfil);

router.get('/CuentaUsuarios',verificarToken, soloAdmin, TotalUsuarios)

console.log("rutas ok");

export default router;
