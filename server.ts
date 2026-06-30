import dotenv from "dotenv";
dotenv.config();

import http from "http";

import app from "./app.js";
import { connectDatabase } from "./config/database.js";

const DEFAULT_PORT = 5000;
const PORT = Number(process.env.PORT ?? DEFAULT_PORT);

const listen = (
  port: number,
  allowPortFallback: boolean,
): Promise<{ port: number; server: http.Server }> =>
  new Promise((resolve, reject) => {
    const server = http.createServer(app);
    const onError = (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE" && allowPortFallback) {
        console.warn(`Port ${port} is already in use. Trying ${port + 1}.`);
        server.close();
        listen(port + 1, true).then(resolve).catch(reject);
        return;
      }

      reject(error);
    };

    server.once("error", onError);
    server.listen(port, () => {
      server.off("error", onError);
      resolve({ port, server });
    });
  });

const startServer = async () => {
  try {
    await connectDatabase();

    const { port } = await listen(PORT, !process.env.PORT);

    console.log("==================================");
    console.log(`Server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV ?? "development"}`);
    console.log("==================================");
  } catch (error) {
    console.error("Server failed to start");
    console.error(error);
    process.exit(1);
  }
};

startServer();
