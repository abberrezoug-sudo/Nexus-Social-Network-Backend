import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
///
import { postRoutes } from "./routes/post.routes.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.use("/api/posts", postRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Nexus API is running",
  });
});
app.use("/api/auth", authRoutes);
app.use((_req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

export default app;
