import DbFactory from "@/infrastructure/database/db.factory.js";

export const db = DbFactory.getMainDatabase().db;