import { ApiError } from "@/shared/errors/apiError.js";
import type { NotificationRepository } from "@/modules/notifications/notification.repository.js";
import type {
    AdminTemplateRow,
    TemplateWithVersion,
} from "@/modules/notifications/notification.repository.js";
import type { NotificationChannel } from "@/modules/notifications/schema.js";

export class TemplateService {
    constructor(private readonly repo: NotificationRepository) {}

    async getActive(
        key: string,
        channel: NotificationChannel,
        locale = "en",
    ): Promise<TemplateWithVersion> {
        const found = await this.repo.findTemplateByKey(key, channel, locale);
        if (!found) {
            throw ApiError.notFound(`notification template ${key}/${channel} not found`);
        }
        return found;
    }

    listAdmin(): Promise<AdminTemplateRow[]> {
        return this.repo.listTemplates();
    }

    async patch(id: string, input: { name?: string; isActive?: boolean }) {
        const existing = await this.repo.findTemplateById(id);
        if (!existing) throw ApiError.notFound("notification template not found");
        const updated = await this.repo.updateTemplate(id, input);
        if (!updated) throw ApiError.notFound("notification template not found");
        return updated;
    }

    async addVersion(
        id: string,
        input: { subject?: string | null; content: string; variables?: string[] },
    ) {
        const existing = await this.repo.findTemplateById(id);
        if (!existing) throw ApiError.notFound("notification template not found");
        if (!existing.editable) {
            throw ApiError.forbidden("this template cannot be edited");
        }
        const next = (await this.repo.maxVersion(id)) + 1;
        return this.repo.createVersion({
            templateId: id,
            version: next,
            subject: input.subject ?? null,
            content: input.content,
            variables: input.variables ?? [],
        });
    }
}
