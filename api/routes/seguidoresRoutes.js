import express from 'express';
import { verificarToken } from '../controllers/recetasController.js'; 
import { obtenerSeguidores} from '../controllers/seguidoresController.js'; 

const router = express.Router();

router.get("/obtenerseguidores",verificarToken, obtenerSeguidores);


console.log("rutas ok");

export default router;
