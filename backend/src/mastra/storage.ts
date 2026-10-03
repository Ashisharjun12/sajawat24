import { PostgresStore } from "@mastra/pg";
import DbFactory from "../infrastructure/database/db.factory.js";
import { isAiInfrastructureEnabled } from "./ai-config.js";

let aiStorage: PostgresStore | null = null;

export function getAiStorage(): PostgresStore {
    if (!isAiInfrastructureEnabled()) {
        throw new Error("AI storage is disabled (set AI_ENABLED=true and AI_DATABASE_URL)");
    }
    if (!aiStorage) {
        const aiDatabase = DbFactory.getAIDatabase();
        aiStorage = new PostgresStore({
            id: "ai-database-storage",
            pool: aiDatabase.getPool(),
            schemaName: "mastra",
        });
    }
    return aiStorage;
}
