import { z } from "zod";
import { isValidSectionBadgeColor } from "@/module/catalog/lib/section-badge-color";

export const CATEGORY_ICON_KEYS = [
  "cake",
  "heart",
  "baby",
  "gem",
  "party",
  "sparkles",
  "building",
  "heart-handshake",
  "gift",
  "flower",
];

export const CATEGORY_ICON_TONES = [
  "amber",
  "rose",
  "sky",
  "violet",
  "orange",
  "emerald",
  "slate",
  "pink",
];

export const CATEGORY_ICON_LABELS = {
  cake: "Cake",
  heart: "Heart",
  baby: "Baby",
  gem: "Gem",
  party: "Party",
  sparkles: "Sparkles",
  building: "Building",
  "heart-handshake": "Handshake",
  gift: "Gift",
  flower: "Flower",
};

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .trim()
    .refine((v) => v.length === 0 || v.length >= 2, "Slug must be at least 2 characters"),
  iconKey: z.enum(CATEGORY_ICON_KEYS).optional(),
  iconTone: z.enum(CATEGORY_ICON_TONES).optional(),
  isActive: z.boolean(),
});

const uuidOrEmpty = z
  .string()
  .refine((v) => v.length === 0 || z.string().uuid().safeParse(v).success, "Invalid subcategory");

/** Map API product.category to admin form parent + optional subcategory. */
export function productCategoryToFormFields(category, productCategoryId) {
  if (!category?.id) {
    return { parentCategoryId: "", categoryId: "" };
  }
  if (category.parentId) {
    return {
      parentCategoryId: category.parentId,
      categoryId: productCategoryId ?? category.id,
    };
  }
  return { parentCategoryId: category.id, categoryId: "" };
}

/** Category id stored on the product (subcategory if set, else parent). */
export function resolveProductCategoryId(values) {
  return values.categoryId || values.parentCategoryId || "";
}

export const productFormSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    slug: z
      .string()
      .trim()
      .refine((v) => v.length === 0 || v.length >= 2, "Slug must be at least 2 characters"),
    description: z.string(),
    parentCategoryId: z.string().uuid("Select a category"),
    categoryId: uuidOrEmpty,
    isActive: z.boolean(),
    scheduledEnabled: z.boolean(),
    instantEnabled: z.boolean(),
    instantShowBadge: z.boolean(),
    instantBadgeLabel: z.string().trim().max(40),
    instantPdpNote: z.string().trim().max(500),
    instantEtaMinutes: z
      .union([z.literal(""), z.coerce.number().int().min(15).max(480)])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    paymentCod: z.boolean(),
    paymentOnline: z.boolean(),
  })
  .refine((value) => value.scheduledEnabled || value.instantEnabled, {
    message: "Turn on Scheduled or Instant",
    path: ["scheduledEnabled"],
  })
  .refine((value) => value.paymentCod || value.paymentOnline, {
    message: "Turn on COD or Online payment",
    path: ["paymentCod"],
  });

export const addonFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .trim()
    .refine((v) => v.length === 0 || v.length >= 2, "Slug must be at least 2 characters"),
  description: z.string(),
  isActive: z.boolean(),
  maxQuantity: z.coerce.number().int().min(1, "Min 1").max(20, "Max 20"),
});

const sectionBadgeColorSchema = z
  .string()
  .max(7)
  .refine(isValidSectionBadgeColor, {
    message: "Pick a preset or enter a valid hex color (#RGB or #RRGGBB)",
  })

export const sectionSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .trim()
    .refine((v) => v.length === 0 || v.length >= 2, "Slug must be at least 2 characters"),
  sortIndex: z.coerce.number().int(),
  badgeColor: sectionBadgeColorSchema,
  isActive: z.boolean(),
});
