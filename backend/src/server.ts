import { createServer } from "node:http";
import App from "@/app.js";
import { _config } from "@/config/config.js";
import { db } from "@/config/db.js";
import { RealtimeFactory } from "@/infrastructure/realtime/realtime.factory.js";
import { logger } from "@/utils/logger.js";
import { startNotificationWorkers } from "@/worker/start-workers.js";

const start = async () => {
  try {
    await db();

    if (_config.NODE_ENV !== "production" && process.env.NOTIFICATION_WORKER_EXTERNAL !== "true") {
      await startNotificationWorkers();
      logger.info(
        "Notification workers running inside API process (dev). Set NOTIFICATION_WORKER_EXTERNAL=true to use a separate worker.",
      );
    }

    const appInstance = new App();
    await appInstance.setupMastra();

    const app = appInstance.getApp();
    const httpServer = createServer(app);

    const realtime = RealtimeFactory.getProvider();
    if (realtime.attach) {
      await realtime.attach(httpServer);
    }

    const PORT = _config.PORT ?? 3000;

    httpServer.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });

    logger.info("server started");
  } catch (error) {
    logger.error(error, "Failed to start the server");
    process.exit(1);
  }
};

void start();
