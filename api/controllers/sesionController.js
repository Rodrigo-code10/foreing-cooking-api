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
        const token = jwt.sign({ id: nuevoUsuario._id }, JWT_SECRET, { expiresIn: '7 days' });

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

        // Verificar contraseña
        const passwordValida = await bcrypt.compare(password, usuario.passwordHash);
        if (!passwordValida) {
            return res.status(400).json({ error: 'Credenciales incorrectas' });
        }

        // Crear token JWT
        const token = jwt.sign({ id: usuario._id }, JWT_SECRET, { expiresIn: '7 days' });

        res.json({
            mensaje: 'Login exitoso',
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email,
                foto: usuario.foto,
                status: usuario.status,
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al iniciar sesión', detalle: error.message });
    }
}

//Modifica Perfil
export async function ModificarPerfil(req, res) {
    try {
        const { id, nombre, status } = req.body;
        if (!id) return res.status(400).json({ success: false, error: "ID requerido" });

        const updateData = {};
        if(nombre) updateData.nombre = nombre;
        if(status) updateData.status = status;
        if(req.file) updateData.foto = `/uploads/${req.file.filename}`;

        const modificaUsuario = await Usuario.findByIdAndUpdate(id, updateData, { new: true });
        if(!modificaUsuario) return res.status(404).json({ success: false, error: "Usuario no encontrado" });

        res.status(200).json({ success: true, usuario: modificaUsuario });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al actualizar' });
    }
}

