import express from 'express';
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
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

const subirImagenCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "usuarios" },
            (error, result) => {
                if (result) resolve(result.secure_url);
                else reject(error);
            }
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
};
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Ruta para ver usuario
router.post('/login', iniciarSesion);    

// Ruta para registrar un nuevo usuario
router.post('/registrar', registrarUsuario); 

router.put('/editarperfil', verificarToken, upload.single("foto"), async (req, res) => {
    try {
        let urlFoto;
        if (req.file) {
            urlFoto = await subirImagenCloudinary(req.file.buffer);
        }

        // Pasamos la URL de la foto a la función del controlador
        await ModificarPerfil(req, res, urlFoto);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error subiendo la imagen" });
    }
});

router.get('/BuscarUsuario',verificarToken, BuscarUsuario);

//Panel  Administrativo
router.put('/usuario/:id/Estado',verificarToken, soloAdmin, EstadoPerfil);

router.get('/CuentaUsuarios',verificarToken, soloAdmin, TotalUsuarios)

console.log("rutas ok");

export default router;
