import { PushDeviceRepository } from "@/modules/notifications/devices/device.repository.js";
import { PushDeviceService } from "@/modules/notifications/devices/device.service.js";
import { NotificationRepository } from "@/modules/notifications/notification.repository.js";
import { NotificationService } from "@/modules/notifications/notification.service.js";
import { PreferenceService } from "@/modules/notifications/preferences/preference.service.js";
import { TemplateService } from "@/modules/notifications/templates/template.service.js";
import { UserNotificationController } from "@/modules/notifications/user-notification.controller.js";
import { VendorNotificationController } from "@/modules/notifications/vendor-notification.controller.js";

export const notificationRepository = new NotificationRepository();
export const pushDeviceRepository = new PushDeviceRepository();
export const pushDeviceService = new PushDeviceService(pushDeviceRepository);
export const templateService = new TemplateService(notificationRepository);
export const preferenceService = new PreferenceService(notificationRepository);
export const notificationService = new NotificationService(
    notificationRepository,
    templateService,
    preferenceService,
);
export const vendorNotificationController = new VendorNotificationController(
    pushDeviceService,
    notificationRepository,
);
export const userNotificationController = new UserNotificationController(
    pushDeviceService,
    notificationRepository,
);
