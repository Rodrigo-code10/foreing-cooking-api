import { Usuario } from "../models/usuario.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET

export async function registrarUsuario(req, res) {
    try {
        const { nombre, email, password } = req.body;

        // Verificar si el usuario ya existe
        const usuarioExistente = await Usuario.findOne({ email });
        if (usuarioExistente) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Encriptar contraseña
        const passwordHash = await bcrypt.hash(password, 10);

        // Crear usuario
        const nuevoUsuario = await Usuario.create({
            nombre,
            email,
            passwordHash: passwordHash,
        });

        // Crear token JWT
        const token = jwt.sign({ id: nuevoUsuario._id ,rol: nuevoUsuario.rol }, JWT_SECRET, { expiresIn: '7 days' });

        // Responder al cliente
        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            token,
            usuario: {
                id: nuevoUsuario._id,
                nombre: nuevoUsuario.nombre,
                email: nuevoUsuario.email,
                rol: nuevoUsuario.rol,
                foto: nuevoUsuario.foto,
                status: nuevoUsuario.status,
            }
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Hubo un error en el registro' });
    }
}

export async function iniciarSesion(req, res){
    try {
        const { email, password } = req.body;

        // Buscar usuario
        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(400).json({ error: 'Credenciales incorrectas' });
        }

        // Verificar si está desactivado
        if (usuario.estado === "desactive") {
            return res.status(403).json({ error: "Tu cuenta está desactivada. Contacta al administrador." });
        }

        // Verificar contraseña
        const passwordValida = await bcrypt.compare(password, usuario.passwordHash);
        if (!passwordValida) {
            return res.status(400).json({ error: 'Credenciales incorrectas' });
        }

        // Crear token JWT
        const token = jwt.sign({ id: usuario._id, rol: usuario.rol  }, JWT_SECRET, { expiresIn: '7 days' });

        res.json({
            mensaje: 'Login exitoso',
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol,
                foto: usuario.foto,
                status: usuario.status,
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al iniciar sesión', detalle: error.message });
    }
}

//Modifica Perfil
export async function ModificarPerfil(req, res,urlFoto) {
    try {
        const { id, nombre, status } = req.body;
        if (!id) return res.status(400).json({ success: false, error: "ID requerido" });

        const updateData = {};
        if(nombre) updateData.nombre = nombre;
        if(status) updateData.status = status;
        if(urlFoto) updateData.foto = urlFoto;

        const modificaUsuario = await Usuario.findByIdAndUpdate(id, updateData, { new: true });
        if(!modificaUsuario) return res.status(404).json({ success: false, error: "Usuario no encontrado" });

        res.status(200).json({ success: true, usuario: modificaUsuario });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al actualizar' });
    }
}

export async function EstadoPerfil(req, res) {
    try {
        const { estado } = req.body;

        if (!estado) {
            return res.status(400).json({ error: "Debes enviar el estado" });
        }

        const usuario = await Usuario.findByIdAndUpdate(
            req.params.id,
            { estado }, 
            { new: true }
        );

        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.json(usuario);
    } catch (err) {
        console.error("Error al actualizar estado:", err);
        res.status(500).json({ error: "Error al actualizar estado del usuario" });
    }
}

export async function TotalUsuarios(req, res) {
    try {
        // Agrupo por estado
        const porEstado = await Usuario.aggregate([
            {
                $group: {
                    _id: "$estado",
                    total: { $sum: 1 }
                }
            }
        ]);
        const total = await Usuario.countDocuments(); //General
        const respuesta = {
            total,
            active: porEstado.find(x => x._id === "active")?.total || 0,
            desactive: porEstado.find(x => x._id === "desactive")?.total || 0,
        };
      res.json(respuesta);
    } catch (err) {
      console.error("Error en Pendiente:", err);
      res.status(500).json({ error: "Error obteniendo usuarios" });
    }
}

export async function BuscarUsuario(req, res) {
    try {
        const { nombre } = req.query;

        if (!nombre) {
            return res.status(400).json({ error: "Debes enviar el nombre a buscar" });
        }

        const usuarios = await Usuario.find({
            nombre: { $regex: nombre, $options: "i" }
        });

        res.json(usuarios);

    } catch (err) {
        console.error("Error", err);
        res.status(500).json({ error: "Error obteniendo usuario" });
    }
}
