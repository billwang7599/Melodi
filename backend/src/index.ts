import dotenv from "dotenv";
import express, { Application, Request, Response } from "express";
import { initializeDatabase } from "./db";
import authRoutes from "./routes/auth";

const cors = require("cors");

const allowedOrigins = ["http://localhost:8081"];

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(
  cors({
    origin: function (origin: any, callback: any) {
      // Allow requests from specified origins
      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        console.log(origin);

        callback(new Error("Origin not allowed by CORS"));
      }
    },
  })
);

app.get("/", (req: Request, res: Response) => {
  res.send("Melodi Backend is running!");
});

app.use("/api/auth", authRoutes);

const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
