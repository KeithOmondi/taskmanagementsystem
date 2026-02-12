import { httpServer } from "./app"; // Import the wrapped httpServer, not just the app
import { env } from "./config/env";

const { PORT, NODE_ENV } = env;

// Use httpServer.listen instead of app.listen
const server = httpServer.listen(PORT, () => {
  console.log(
    `🚀 Intelligence Command running in ${NODE_ENV.toUpperCase()} mode on port ${PORT}`,
  );
  console.log(`📡 WebSocket Gateway active and synchronized`);
});

/* ==========================================
    UNHANDLED REJECTION HANDLING
   ========================================== */
process.on("unhandledRejection", (err: Error) => {
  console.error(`CRITICAL ERROR: ${err.message}`);
  console.log("Shutting down the server due to Unhandled Promise Rejection...");

  // Close the httpServer gracefully
  server.close(() => {
    process.exit(1);
  });
});
