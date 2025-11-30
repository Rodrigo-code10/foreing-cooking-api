import jwt from "jsonwebtoken";
import { Usuario } from "../models/usuario.js";
const JWT_SECRET = process.env.JWT_SECRET;

export async function verificarToken(req, res, next) {
    const header = req.headers['authorization'];

    if (!header) return res.status(401).json({ error: "Token no proporcionado" });

    const [bearer, token] = header.split(" ");
    if (bearer !== "Bearer" || !token) return res.status(401).json({ error: "Formato de token inválido" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await Usuario.findById(decoded.id);
        if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

        if (user.estado === "desactive") {
            return res.status(403).json({ error: "Cuenta desactivada" });
        }

        req.usuarioId = decoded.id;
        req.usuarioRol = decoded.rol;
        next(); 

    } catch (error) {
        res.status(403).json({ error: "Token inválido o expirado" });
    }
}

export function soloAdmin(req, res, next) {
    if (req.usuarioRol !== "admin") {
      return res.status(403).json({ error: "No tienes permisos" });
    }
    next();
}