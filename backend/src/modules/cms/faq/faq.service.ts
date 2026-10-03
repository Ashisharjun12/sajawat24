import { ApiError } from "@/shared/errors/apiError.js";
import { parsePagination } from "@/shared/http/pagination.js";
import type { CmsHomeFaqRepository } from "@/modules/cms/faq/faq.repository.js";
import type { z } from "zod";
import type { createCmsFaqDto, patchCmsFaqDto } from "@/modules/cms/faq/faq.dto.js";
import { invalidateHome } from "@/modules/cms/cache/cms-cache.invalidation.js";

type CreateInput = z.infer<typeof createCmsFaqDto>;
type PatchInput = z.infer<typeof patchCmsFaqDto>;

export class CmsHomeFaqService {
    constructor(private readonly faqs: CmsHomeFaqRepository) {}

    async listAdmin(query: Record<string, unknown>) {
        const pagination = parsePagination(query);
        const { items, total } = await this.faqs.list(pagination, {
            status: query.status as CreateInput["status"] | undefined,
        });
        return {
            items,
            page: pagination.page,
            limit: pagination.limit,
            total,
        };
    }

    async getAdmin(id: string) {
        const row = await this.faqs.findById(id);
        if (!row) throw ApiError.notFound("FAQ not found");
        return row;
    }

    async create(input: CreateInput) {
        this.assertPublishable(input.status, input.question, input.answer);
        const sortIndex = input.sortIndex ?? await this.faqs.nextSortIndex();
        const row = await this.faqs.insert({
            question: input.question.trim(),
            answer: input.answer.trim(),
            platforms: input.platforms,
            status: input.status,
            sortIndex,
        });
        await invalidateHome();
        return row;
    }

    async patch(id: string, input: PatchInput) {
        const existing = await this.faqs.findById(id);
        if (!existing) throw ApiError.notFound("FAQ not found");
        const status = input.status ?? existing.status;
        const question = (input.question ?? existing.question).trim();
        const answer = (input.answer ?? existing.answer).trim();
        this.assertPublishable(status, question, answer);
        const row = await this.faqs.update(id, {
            question: input.question !== undefined ? input.question.trim() : undefined,
            answer: input.answer !== undefined ? input.answer.trim() : undefined,
            platforms: input.platforms,
            status: input.status,
            sortIndex: input.sortIndex,
        });
        if (!row) throw ApiError.notFound("FAQ not found");
        await invalidateHome();
        return row;
    }

    async delete(id: string) {
        const ok = await this.faqs.delete(id);
        if (!ok) throw ApiError.notFound("FAQ not found");
        await invalidateHome();
        return { id };
    }

    async reorder(ids: string[]) {
        try {
            await this.faqs.reorder(ids);
        } catch {
            throw ApiError.badRequest("Invalid FAQ reorder payload");
        }
        await invalidateHome();
        return { ok: true };
    }

    async listPublishedForHome() {
        return this.faqs.listPublished();
    }

    toPublic(row: { id: string; question: string; answer: string }) {
        return {
            id: row.id,
            question: row.question,
            answer: row.answer,
        };
    }

    private assertPublishable(status: CreateInput["status"], question: string, answer: string) {
        if (status !== "published") return;
        if (!question.trim() || !answer.trim()) {
            throw ApiError.badRequest("question and answer are required to publish");
        }
    }
}
