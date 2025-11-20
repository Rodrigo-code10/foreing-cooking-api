import { Follow } from "../models/seguidores.js";

export async function obtenerSeguidores(req, res) {
    try {
        const userId = req.usuarioId;
        if (!userId) return res.status(401).json({ error: "Usuario no autenticado" });

        // Buscamos los favoritos de este usuario
        const seguidores = await Follow .find({ userId: userId })
            .populate({
                path: "followeId", 
                populate: { path: "autor", select: "nombre foto" } 
            });

        const listaSeguidores = seguidores.map(f => f.followerId);
        res.json(listaSeguidores);

    } catch (error) {
        console.error("Error al obtener favoritos:", error);
        res.status(500).json({ error: "Error al obtener los seguidores", detalle: error.message });
    }
}

