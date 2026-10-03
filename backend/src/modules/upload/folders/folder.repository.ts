import { count, eq, isNull } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { mediaFolders, type MediaFolder, type NewMediaFolder } from "@/modules/upload/media/media.schema.js";

export type FolderPatch = Partial<Pick<MediaFolder, "name" | "slug" | "parentId">>;

export interface IFolderRepository {
    findById(id: string): Promise<MediaFolder | undefined>;
    listAll(): Promise<MediaFolder[]>;
    listByParent(parentId: string | null): Promise<MediaFolder[]>;
    countChildren(parentId: string): Promise<number>;
    insert(data: NewMediaFolder): Promise<MediaFolder>;
    update(id: string, data: FolderPatch): Promise<MediaFolder | undefined>;
    remove(id: string): Promise<void>;
}

export class FolderRepository implements IFolderRepository {
    async findById(id: string): Promise<MediaFolder | undefined> {
        const [row] = await db.select().from(mediaFolders).where(eq(mediaFolders.id, id)).limit(1);
        return row;
    }

    async listAll(): Promise<MediaFolder[]> {
        return db.select().from(mediaFolders).orderBy(mediaFolders.name);
    }

    async listByParent(parentId: string | null): Promise<MediaFolder[]> {
        const where = parentId === null ? isNull(mediaFolders.parentId) : eq(mediaFolders.parentId, parentId);
        return db.select().from(mediaFolders).where(where).orderBy(mediaFolders.name);
    }

    async countChildren(parentId: string): Promise<number> {
        const [row] = await db
            .select({ value: count() })
            .from(mediaFolders)
            .where(eq(mediaFolders.parentId, parentId));
        return Number(row?.value ?? 0);
    }

    async insert(data: NewMediaFolder): Promise<MediaFolder> {
        const [row] = await db.insert(mediaFolders).values(data).returning();
        if (!row) throw new Error("failed to create folder");
        return row;
    }

    async update(id: string, data: FolderPatch): Promise<MediaFolder | undefined> {
        const [row] = await db
            .update(mediaFolders)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(mediaFolders.id, id))
            .returning();
        return row;
    }

    async remove(id: string): Promise<void> {
        await db.delete(mediaFolders).where(eq(mediaFolders.id, id));
    }
}
