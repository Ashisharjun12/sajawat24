import { db } from "@/config/db.js";
import { registerDispatchModule } from "@/modules/dispatch/register-dispatch-module.js";
import { startNotificationWorkers } from "@/worker/start-workers.js";
import { logger } from "@/utils/logger.js";

void (async () => {
    try {
        await db();
        registerDispatchModule();
        await startNotificationWorkers();
    } catch (error) {
        logger.fatal(error, "worker failed to start");
        process.exit(1);
    }
})();
