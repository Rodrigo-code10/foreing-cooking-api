import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import {connectMongo} from "./config/db.js";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import sesionRoutes from "./routes/sesionRoutes.js";
import recetasRoutes from "./routes/recetasRoutes.js";
import favoritasRoutes from "./routes/favoritasRoutes.js";
import seguidoresRoutes from "./routes/seguidoresRoutes.js";

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

// Middleware
app.use(cors());
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


// Inicio del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
    console.log(`http://localhost:${PORT}/`);
});
