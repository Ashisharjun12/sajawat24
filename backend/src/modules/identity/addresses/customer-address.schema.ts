import { boolean, doublePrecision, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { geoPointSourceEnum } from "@/modules/booking/domain/geo-enums.js";
import { cities } from "@/modules/geo/cities/city.schema.js";
import { users } from "@/modules/identity/users/user.schema.js";

export const customerAddresses = pgTable("customer_addresses", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    addressLine: text("address_line").notNull(),
    landmark: text("landmark"),
    pincode: text("pincode").notNull(),
    cityId: uuid("city_id").references(() => cities.id, { onDelete: "set null" }),
    cityName: text("city_name").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    geoSource: geoPointSourceEnum("geo_source"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CustomerAddress = typeof customerAddresses.$inferSelect;
export type NewCustomerAddress = typeof customerAddresses.$inferInsert;
