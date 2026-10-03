import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { MastraServer } from "@mastra/express";
import { errorHandler } from "@/shared/errors/apiHandler.js";
import { httpLogger } from "@/shared/middlewares/logger.middleware.js";
import { getMastra, isAiInfrastructureEnabled } from "@/mastra/index.js";
import { _config } from "@/config/config.js";
import { authRouter, userRouter, vendorRouter } from "@/modules/identity/index.js";
import { geoRouter } from "@/modules/geo/index.js";
import { promotionsPublicRouter } from "@/modules/promotions/index.js";
import { catalogRouter } from "@/modules/catalog/index.js";
import { adminRouter } from "@/modules/admin/index.js";
import { instantConfigPublicRouter, paymentsPublicRouter } from "@/modules/ops/index.js";
import { cartRouter, orderRouter, paymentIntentRouter } from "@/modules/booking/index.js";
import { userNotificationPreferenceRouter } from "@/modules/notifications/index.js";
import { userChatRouter, vendorChatRouter } from "@/modules/chat/index.js";
import { createPaymentWebhookRouter } from "@/modules/payments/index.js";
import { aiPublicRouter } from "@/modules/ai/index.js";
import { createMapsPublicRouter } from "@/modules/maps/index.js";

class App {
  private app: Application;

  constructor() {
    this.app = express();
    this.app.set("trust proxy", 1);
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  async setupMastra(): Promise<void> {
    if (!isAiInfrastructureEnabled()) {
      return;
    }
    const server = new MastraServer({ app: this.app, mastra: getMastra() });
    await server.init();
  }

  private setupMiddleware() {
    const corsOption = {
        origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
            if (!origin) {
                callback(null, true);
                return;
            }
            const allowed = [
                ..._config.WEB_APP_ORIGINS,
                ..._config.ADMIN_APP_ORIGINS,
                process.env.EXPO_PUBLIC_ORIGIN,
            ].filter(Boolean) as string[];
            if (
                allowed.includes(origin) ||
                /^https:\/\/[a-z0-9-]+\.ngrok-free\.app$/i.test(origin) ||
                /^exp:\/\//i.test(origin)
            ) {
                callback(null, true);
                return;
            }
            callback(null, false);
        },
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        credentials: true,
    };

    this.app.use(helmet());
    this.app.use(cors(corsOption));
    this.app.options(/.*/, cors(corsOption));
    this.app.use(httpLogger);
    this.app.use(
        "/api/v1/webhooks",
        express.raw({ type: "application/json" }),
        createPaymentWebhookRouter(),
    );
    this.app.use(express.json());
    this.app.use(cookieParser());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes() {
    this.app.get("/health", (_req, res) => {
      res.status(200).json({ message: "Decorbuddys is Live" });
    });

    this.app.use("/api/v1/auth", authRouter);
    this.app.use("/api/v1/vendor/chat", vendorChatRouter);
    this.app.use("/api/v1/vendor", vendorRouter);
    this.app.use("/api/v1/user/notification-preferences", userNotificationPreferenceRouter);
    this.app.use("/api/v1/user/chat", userChatRouter);
    this.app.use("/api/v1/user", userRouter);
    this.app.use("/api/v1/geo", geoRouter);
    this.app.use("/api/v1/maps", createMapsPublicRouter());
    this.app.use("/api/v1/catalog", catalogRouter);
    this.app.use("/api/v1/ai", aiPublicRouter);
    this.app.use("/api/v1/config", instantConfigPublicRouter);
    this.app.use("/api/v1/payments", paymentsPublicRouter);
    this.app.use("/api/v1/payments", paymentIntentRouter);
    this.app.use("/api/v1/promotions", promotionsPublicRouter);
    this.app.use("/api/v1/cart", cartRouter);
    this.app.use("/api/v1/orders", orderRouter);
    this.app.use("/api/v1/admin", adminRouter);
  }

  private setupErrorHandling() {
    this.app.use(errorHandler);
  }

  getApp(): Application {
    return this.app;
  }
}

export default App;
