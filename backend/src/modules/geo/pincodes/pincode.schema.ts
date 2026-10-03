import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { cities } from "../cities/city.schema.js";

export const pincodes = pgTable("pincodes", {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    cityId: uuid("city_id")
        .notNull()
        .references(() => cities.id, { onDelete: "restrict" }),
    isServiceable: boolean("is_serviceable").notNull().default(true),
    locality: text("locality"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Pincode = typeof pincodes.$inferSelect;
export type NewPincode = typeof pincodes.$inferInsert;
