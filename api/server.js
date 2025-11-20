import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import {connectMongo} from "./config/db.js";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import fs from "fs"; 
import path from "path";
import { fileURLToPath } from 'url';

import sesionRoutes from "./routes/sesionRoutes.js";
import recetasRoutes from "./routes/recetasRoutes.js";
import favoritasRoutes from "./routes/favoritasRoutes.js";
import seguidoresRoutes from "./routes/seguidoresRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API de Opiniones",
            version: "1.0.0",
            description: "API para gestionar MongoDB",
        },
    },
    apis: ["./controllers/*.js"], // comentarios con formato @openapi
};

// //instancia de swagger
// const swaggerDocs = swaggerJSDoc(swaggerOptions);
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));


dotenv.config(); // Cargar variables de entorno

const app = express();

// Crear carpetas necesarias
const uploadsDir = path.join(__dirname, '../public/uploads');
const defaultDir = path.join(__dirname, '../public/default');

const defaultImageSrc = path.join(__dirname, 'default/SinFoto.png'); 
const defaultImageDest = path.join(defaultDir, 'SinFoto.png');

try {
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('📁 Carpeta uploads creada');
    }
    if (!fs.existsSync(defaultDir)) {
        fs.mkdirSync(defaultDir, { recursive: true });
        console.log('📁 Carpeta default creada');
    }
    if (!fs.existsSync(defaultImageDest)) {
        fs.copyFileSync(defaultImageSrc, defaultImageDest);
        console.log('Imagen por default copiada automáticamente');
    }
} catch (error) {
    console.error('Error creando carpetas:', error);
}

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // para entender peticiones JSON

// Conexiones a bases de datos 
await connectMongo();

// Rutas
app.get("/", (req,res) => {
    res.send(`
    <h2> API corriendo correctamente</h2>
    <p>Entorno: <b>${process.env.NODE_ENV || "development"}</b></p>
    <p>Puerto: <b>${process.env.MONGO_URI}</b></p>`);
});

app.get("/health", async (req, res) => {
    try {
        const mongoOk = mongoose.connection.readyState === 1;
        
        res.status(mongoOk ? 200 : 503).json({
            status: mongoOk ? "ok" : "error",
            services: {
                mongo: mongoOk ? "connected" : "disconnected",
            },
            environment: process.env.NODE_ENV || "development",
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        res.status(503).json({
            status: "error",
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});



// Rutas 
app.use("/", sesionRoutes);

app.use("/", recetasRoutes);
app.use('/uploads', express.static('public/uploads'));
app.use('/default', express.static('public/default'));

app.use("/", favoritasRoutes);

app.use("/", seguidoresRoutes);


 
// Instancia de swagger
const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));


app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: 'Error del servidor',
        detalle: err.message
    });
});


// Inicio del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
    console.log(`http://localhost:${PORT}/`);
});
