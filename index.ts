import express from "express";
import http from "http";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./src/lib/config/database";
import { initSocket } from "./src/socket";
import { startReservationScheduler } from "./src/scheduler/reservationScheduler";
import { globalErrorHandler } from "./src/lib/helpers/globalError";
import userRoutes from "./src/routes/userRoutes";
import dropRoutes from "./src/routes/dropRoutes";
import reservationRoutes from "./src/routes/reservationRoutes";
import purchaseRoutes from "./src/routes/purchaseRoutes";

// need to import models to registered
import "./src/models";

dotenv.config();

const app = express();

app.use(express.json());

app.use(morgan("dev"));

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  }),
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
});

app.use(limiter);

// routes
app.use("/api/users", userRoutes);
app.use("/api/drops", dropRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/purchases", purchaseRoutes);

// health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(globalErrorHandler);

const server = http.createServer(app);

// init websocket
initSocket(server);

const PORT = process.env.PORT || 5000;

// sync db
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("database synced");

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    // start the reservation expiry checker
    startReservationScheduler();
  })
  .catch((err) => {
    console.error("failed to sync database:", err);
    process.exit(1);
  });
