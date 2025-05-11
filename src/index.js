import express from "express";
import cors from "cors";
import "dotenv/config";
import job from "./lib/cron.js"; // ✅ matches actual file

import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";

import { connectDB } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 3000;

job.start();
app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
  connectDB();
});
