import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import morgan from "morgan";

import sequelize from "./lib/config/database";
import { initSocket } from "./socket";
import { startReservationScheduler } from "./scheduler/reservationScheduler";
import { globalErrorHandler } from "./lib/helpers/globalError";

// route imports
import userRoutes from "./routes/userRoutes";
import dropRoutes from "./routes/dropRoutes";
import reservationRoutes from "./routes/reservationRoutes";
import purchaseRoutes from "./routes/purchaseRoutes";

dotenv.config();

const app = express();
const server = http.createServer(app);

// middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan("dev"));

// init socket.io on the http server
initSocket(server);

// api routes
app.use("/api/users", userRoutes);
app.use("/api/drops", dropRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/purchases", purchaseRoutes);

// basic helth check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// catch-all global error handler
app.use(globalErrorHandler);

const PORT = parseInt(process.env.PORT || "5000");

// sync db then start listning
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("database synced succesfully");

    // kick off the reservaton expiry scheduler
    startReservationScheduler();

    server.listen(PORT, () => {
      console.log(`server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("failed to sync databse:", err);
    process.exit(1);
  });
