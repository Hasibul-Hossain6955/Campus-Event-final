import express from "express";
import cors from "cors";
import "dotenv/config";

import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";

import { connectDB } from "./lib/db.js";
import job from "./lib/cron.js";

const app = express();
const PORT = process.env.PORT || 3000;

job.start();
app.use(express.json({ limit: "10mb" })); // Increase limit to 10MB or as needed
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
  connectDB();
});
