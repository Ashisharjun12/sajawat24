import {
    notificationService,
    preferenceService,
    pushDeviceService,
    templateService,
    userNotificationController,
    vendorNotificationController,
} from "@/modules/notifications/container.js";
import {
    NotificationPreferenceController,
    NotificationTemplateController,
} from "@/modules/notifications/notification.controller.js";
import {
    createNotificationTemplateAdminRouter,
    createUserPreferenceRouter,
} from "@/modules/notifications/notification.route.js";
import {
    notificationDeliveries,
    notificationInbox,
    notificationTemplateVersions,
    notificationTemplates,
    notifications,
    notificationsOutbox,
    userNotificationPreferences,
} from "@/modules/notifications/schema.js";

const templateController = new NotificationTemplateController(templateService);
const preferenceController = new NotificationPreferenceController(preferenceService);

export const notificationTemplateAdminRouter =
    createNotificationTemplateAdminRouter(templateController);
export const userNotificationPreferenceRouter = createUserPreferenceRouter(preferenceController);

export {
    notificationService,
    pushDeviceService,
    userNotificationController,
    vendorNotificationController,
};
export type { INotificationService, NotifyInput } from "@/modules/notifications/notification.service.js";

export {
    notificationTemplates,
    notificationTemplateVersions,
    userNotificationPreferences,
    notifications,
    notificationDeliveries,
    notificationsOutbox,
    notificationInbox,
};
