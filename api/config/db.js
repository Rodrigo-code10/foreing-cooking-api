import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();


// Conexión MongoDB 
export async function connectMongo() {
  try {
    console.log("Conectando a MongoDB:", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // evita bloqueos largos
    });
    console.log("Conectado a MongoDB");
  } catch (error) {
    console.error("Error conectando a MongoDB:", error.message);
    process.exit(1);
  }
}

