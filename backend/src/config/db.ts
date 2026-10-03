import DbFactory from "@/infrastructure/database/db.factory.js";
import { CacheFactory } from "@/infrastructure/cache/cache.factory.js";

export async function db(): Promise<void> {
  await DbFactory.connectAppDatabase();
  await CacheFactory.connect();
  // await DbFactory.connectAI();
}