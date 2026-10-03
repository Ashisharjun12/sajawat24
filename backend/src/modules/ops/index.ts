import { AuditAdminController } from "@/modules/ops/audit/audit.admin.controller.js";
import { createAuditAdminRouter } from "@/modules/ops/audit/audit.admin.route.js";
import { auditService } from "@/modules/ops/audit/audit.service.js";
import { DashboardController } from "@/modules/ops/dashboard/dashboard.controller.js";
import { createDashboardAdminRouter } from "@/modules/ops/dashboard/dashboard.route.js";
import { DashboardService } from "@/modules/ops/dashboard/dashboard.service.js";
import { SettingController } from "@/modules/ops/settings/setting.controller.js";
import { SettingRepository } from "@/modules/ops/settings/setting.repository.js";
import { createInstantConfigPublicRouter } from "@/modules/ops/settings/instant-config.route.js";
import { createPaymentsPublicRouter, createSettingsAdminRouter } from "@/modules/ops/settings/setting.route.js";
import { platformSettings } from "@/modules/ops/settings/setting.schema.js";
import { SettingService } from "@/modules/ops/settings/setting.service.js";
import type { NotificationChannel } from "@/modules/ops/settings/notification-channels.js";

const settingRepository = new SettingRepository();
export const settingService = new SettingService(settingRepository);
const settingController = new SettingController(settingService);

const dashboardService = new DashboardService();
const dashboardController = new DashboardController(dashboardService);

const auditAdminController = new AuditAdminController(auditService);

export const settingsAdminRouter = createSettingsAdminRouter(settingController);
export const dashboardAdminRouter = createDashboardAdminRouter(dashboardController);
export const auditAdminRouter = createAuditAdminRouter(auditAdminController);
export const paymentsPublicRouter = createPaymentsPublicRouter(settingController);
export const instantConfigPublicRouter = createInstantConfigPublicRouter(settingService);

export function isChannelEnabled(channel: NotificationChannel): Promise<boolean> {
    return settingService.isChannelEnabled(channel);
}

export { platformSettings, auditService };
export type { NotificationChannel, NotificationChannelFlags } from "@/modules/ops/settings/notification-channels.js";
export type { BookingPolicy } from "@/modules/ops/settings/booking-policy.js";
