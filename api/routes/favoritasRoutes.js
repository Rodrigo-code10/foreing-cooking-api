import express from 'express';
import { verificarToken } from '../middleware/auth.js'; 
import { obtenerFavoritos} from '../controllers/favoritesController.js'; 

const router = express.Router();

router.get("/obtenerfavoritos",verificarToken, obtenerFavoritos);


console.log("rutas ok");

export default router;
