import { z } from "zod";

const indianMobile = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number");

const baseBookingSchema = z.object({
  orderKind: z.enum(["catalog", "custom"]),
  customer: z.object({
    name: z.string().trim().min(2, "Name is required").max(120),
    phone: indianMobile,
    email: z.union([z.literal(""), z.string().trim().email("Invalid email")]).optional(),
  }),
  delivery: z.object({
    pincode: z.string().trim().regex(/^\d{6}$/, "Enter a 6-digit pincode"),
    address: z.string().trim().min(6, "Address is required").max(500),
    landmark: z.string().trim().max(200).optional(),
    cityId: z.string().optional(),
  }),
  scheduledAt: z.string().optional(),
  productId: z.string().optional(),
  quantity: z.coerce.number().int().min(1).max(10).default(1),
  addonIds: z.array(z.string().uuid()).default([]),
  customName: z.string().optional(),
  customPriceRupees: z.coerce.number().optional(),
  customImageUploadId: z.string().optional(),
  customImagePreviewUrl: z.string().optional(),
  paymentMethod: z.enum(["prepaid", "cod"]),
  adminNotes: z.string().trim().max(500).optional(),
});

export const createBookingSchema = baseBookingSchema.superRefine((values, ctx) => {
  if (values.orderKind === "catalog") {
    if (!values.productId || !z.string().uuid().safeParse(values.productId).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a package",
        path: ["productId"],
      });
    }
    if (!values.scheduledAt?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pick a setup date and time",
        path: ["scheduledAt"],
      });
    }
    if (!values.delivery.cityId || !z.string().uuid().safeParse(values.delivery.cityId).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a city when choosing a package",
        path: ["delivery", "cityId"],
      });
    }
    return;
  }

  const name = values.customName?.trim() ?? "";
  if (name.length < 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Package name is required",
      path: ["customName"],
    });
  }

  const price = parsePriceRupees(values.customPriceRupees);
  if (price == null || price <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter a valid price in rupees",
      path: ["customPriceRupees"],
    });
  }

  if (!values.delivery.cityId || !z.string().uuid().safeParse(values.delivery.cityId).success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Select a city",
      path: ["delivery", "cityId"],
    });
  }

  if (!values.scheduledAt?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Pick a setup date and time",
      path: ["scheduledAt"],
    });
  }

  if (
    values.customImageUploadId?.trim() &&
    !z.string().uuid().safeParse(values.customImageUploadId.trim()).success
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid image",
      path: ["customImageUploadId"],
    });
  }
});

function parsePriceRupees(value) {
  if (value === "" || value == null) return null
  const n = typeof value === "number" ? value : Number(String(value).trim())
  return Number.isFinite(n) ? n : null
}

function isUuid(value) {
  return z.string().uuid().safeParse(value).success
}

export function isCustomBookingReady(values) {
  if (values.orderKind !== "custom") return false
  const name = values.customName?.trim() ?? ""
  const price = parsePriceRupees(values.customPriceRupees)
  const cityId = values.delivery?.cityId?.trim() ?? ""
  const scheduledAt = values.scheduledAt?.trim() ?? ""
  const scheduledOk =
    scheduledAt.length > 0 && !Number.isNaN(new Date(scheduledAt).getTime())

  return (
    name.length >= 2 &&
    price != null &&
    price > 0 &&
    cityId.length > 0 &&
    isUuid(cityId) &&
    scheduledOk
  )
}

export function toCreateBookingPayload(values, idempotencyKey) {
  const scheduledAt = new Date(values.scheduledAt).toISOString();
  const email = values.customer.email?.trim();

  const shared = {
    customer: {
      name: values.customer.name.trim(),
      phone: values.customer.phone.trim(),
      ...(email ? { email } : {}),
    },
    delivery: {
      pincode: values.delivery.pincode.trim(),
      address: values.delivery.address.trim(),
      cityId: values.delivery.cityId,
      ...(values.delivery.landmark?.trim()
        ? { landmark: values.delivery.landmark.trim() }
        : {}),
    },
    scheduledAt,
    paymentMethod: values.paymentMethod,
    ...(values.adminNotes?.trim() ? { adminNotes: values.adminNotes.trim() } : {}),
    idempotencyKey,
  };

  if (values.orderKind === "custom") {
    const uploadId = values.customImageUploadId?.trim();
    return {
      ...shared,
      orderKind: "custom",
      customLine: {
        name: values.customName.trim(),
        pricePaise: Math.round(Number(values.customPriceRupees) * 100),
        quantity: 1,
        ...(uploadId ? { imageUploadId: uploadId } : {}),
      },
    };
  }

  return {
    ...shared,
    orderKind: "catalog",
    items: [
      {
        productId: values.productId,
        quantity: values.quantity,
        addonIds: values.addonIds ?? [],
      },
    ],
  };
}
