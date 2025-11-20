import { Favorito } from "../models/favoritos.js";

export async function obtenerFavoritos(req, res) {
    try {
        const userId = req.usuarioId;
        if (!userId) return res.status(401).json({ error: "Usuario no autenticado" });

        // Buscamos los favoritos de este usuario
        const favoritos = await Favorito.find({ userId: userId })
            .populate({
                path: "recetaId", 
                populate: { path: "autor", select: "nombre" } 
            });

        const recetasFavoritas = favoritos.map(fav => fav.recetaId);
        res.json(recetasFavoritas);

    } catch (error) {
        console.error("Error al obtener favoritos:", error);
        res.status(500).json({ error: "Error al obtener favoritos", detalle: error.message });
    }
}

