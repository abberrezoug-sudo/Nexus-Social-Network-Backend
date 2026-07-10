import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { graphqlHTTP } from "express-graphql";
///
import { postRoutes } from "./routes/post.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { authMiddleware } from "./middlewares/auth.middleware.js";
import { schema } from "./graphql/schema.js";
import { rootValue } from "./graphql/resolvers.js";

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

app.use(
  "/graphql",
  authMiddleware,
  graphqlHTTP((req) => ({
    schema,
    rootValue,
    graphiql: process.env.NODE_ENV !== "production",
    context: { user: (req as any).user },
  })),
);

app.use("/api/posts", postRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Nexus API is running",
  });
});
app.use((_req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

export default app;
