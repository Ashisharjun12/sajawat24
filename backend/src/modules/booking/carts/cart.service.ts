import { randomUUID } from "node:crypto";
import type { CookieOptions, Request, Response } from "express";
import { _config } from "@/config/config.js";
import { ApiError } from "@/shared/errors/apiError.js";
import {
    getProductForCity,
    normalizeAddonSelections,
    priceQuote,
    selectionsFromCartAddonRows,
    type AddonSelection,
} from "@/modules/catalog/index.js";
import { mergeAddonSelections } from "@/modules/catalog/pricing/addon-selection.js";
import { AddonRepository } from "@/modules/catalog/addons/addon.repository.js";
import { ProductRepository } from "@/modules/catalog/products/product.repository.js";
import {
    assertDeliveryLocation,
    getActiveCityById,
    lookupPincode,
} from "@/modules/geo/index.js";
import type { ICartRepository } from "@/modules/booking/carts/cart.repository.js";
import type { Cart } from "@/modules/booking/carts/cart.schema.js";
import { promotionService } from "@/modules/promotions/index.js";
import { buildCouponEligibilitySummary } from "@/modules/promotions/lib/coupon-summary.js";
import { resolveCouponTargetLabels } from "@/modules/promotions/targets/coupon-target.resolver.js";
import type { PromotionLine } from "@/modules/promotions/promotion.service.js";
import { enrichCartItemsWithAddonImages } from "@/modules/booking/carts/enrich-cart-addon-images.js";

export const GUEST_CART_COOKIE = "guestKey";
const GUEST_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export type CartActor = { id: string } | undefined;

export type AddCartItemInput = {
    productId: string;
    addonIds?: string[];
    addons?: AddonSelection[];
    quantity?: number;
    cityId?: string;
    pincode?: string;
    scheduledAt?: string | null;
    fulfillmentType?: "scheduled" | "instant";
};

export type CartLocationInput = {
    pincode?: string;
    cityId?: string;
};

export type PublicCartAddon = {
    id: string;
    name: string;
    pricePaise: number;
    quantity: number;
    imageUrl: string | null;
};

export type PublicCartItem = {
    id: string;
    productId: string;
    name: string;
    imageUrl: string | null;
    quantity: number;
    productPaise: number;
    addonsPaise: number;
    lineTotalPaise: number;
    paymentCod: boolean;
    paymentOnline: boolean;
    addons: PublicCartAddon[];
};

export type PublicAppliedCoupon = {
    code: string;
    name: string;
    description: string | null;
    eligibilitySummary: string;
};

export type PublicCart = {
    id: string;
    cityId: string | null;
    pincode: string | null;
    fulfillmentType: "scheduled" | "instant" | null;
    deliveryLatitude: number | null;
    deliveryLongitude: number | null;
    scheduledAt: string | null;
    itemCount: number;
    subtotalPaise: number;
    discountPaise: number;
    totalPaise: number;
    appliedCoupon: PublicAppliedCoupon | null;
    items: PublicCartItem[];
};

export interface ICartService {
    getCart(req: Request, res: Response, actor: CartActor): Promise<PublicCart>;
    addItem(req: Request, res: Response, actor: CartActor, input: AddCartItemInput): Promise<PublicCart>;
    patchItem(
        req: Request,
        res: Response,
        actor: CartActor,
        itemId: string,
        quantity: number,
    ): Promise<PublicCart>;
    removeItem(req: Request, res: Response, actor: CartActor, itemId: string): Promise<PublicCart>;
    setLocation(
        req: Request,
        res: Response,
        actor: CartActor,
        input: CartLocationInput,
    ): Promise<PublicCart>;
    setDeliveryGeo(
        req: Request,
        res: Response,
        actor: CartActor,
        input: { latitude: number; longitude: number },
    ): Promise<PublicCart>;
    merge(req: Request, res: Response, actor: { id: string }): Promise<PublicCart>;
    applyCoupon(req: Request, res: Response, actor: CartActor, code: string): Promise<PublicCart>;
    removeCoupon(req: Request, res: Response, actor: CartActor): Promise<PublicCart>;
}

export function guestCookieOptions(): CookieOptions {
    return {
        httpOnly: true,
        secure: _config.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: GUEST_TTL_MS,
        path: "/",
    };
}

function readGuestKey(req: Request): string | undefined {
    const value = req.cookies?.[GUEST_CART_COOKIE];
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function clearGuestCookie(res: Response) {
    res.clearCookie(GUEST_CART_COOKIE, { path: "/" });
}

function setGuestCookie(res: Response, guestKey: string) {
    res.cookie(GUEST_CART_COOKIE, guestKey, guestCookieOptions());
}

export class CartService implements ICartService {
    private readonly addons = new AddonRepository();
    private readonly products = new ProductRepository();

    constructor(private readonly carts: ICartRepository) {}

    async getCart(req: Request, res: Response, actor: CartActor): Promise<PublicCart> {
        if (actor?.id && readGuestKey(req)) {
            await this.mergeGuestIntoUser(req, res, actor.id);
        }
        const cart = await this.resolveCart(req, res, actor, { createIfMissing: true });
        return this.toPublic(cart.id, actor?.id);
    }

    async addItem(
        req: Request,
        res: Response,
        actor: CartActor,
        input: AddCartItemInput,
    ): Promise<PublicCart> {
        if (actor?.id && readGuestKey(req)) {
            await this.mergeGuestIntoUser(req, res, actor.id);
        }
        const cart = await this.resolveCart(req, res, actor, { createIfMissing: true });
        const cityId = await this.ensureCity(cart, {
            cityId: input.cityId,
            pincode: input.pincode,
        });
        const quantity = input.quantity ?? 1;
        const addonSelections = normalizeAddonSelections(input.addonIds, input.addons);
        await priceQuote(input.productId, cityId, addonSelections);
        const product = await getProductForCity(input.productId, cityId);
        let fulfillmentType = cart.fulfillmentType;
        if (input.fulfillmentType) {
            fulfillmentType = input.fulfillmentType;
        } else if (product.instantEnabled && !product.scheduledEnabled) {
            fulfillmentType = "instant";
        } else if (product.scheduledEnabled && !product.instantEnabled) {
            fulfillmentType = "scheduled";
        } else if (input.scheduledAt) {
            fulfillmentType = "scheduled";
        }

        const item = await this.carts.upsertItem(cart.id, input.productId, quantity);
        await this.carts.replaceItemAddons(item.id, addonSelections);
        await this.clearCoupon(cart.id);

        const patch: Parameters<ICartRepository["update"]>[1] = {};
        if (input.scheduledAt !== undefined) {
            patch.scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
        }
        if (fulfillmentType) {
            patch.fulfillmentType = fulfillmentType;
        }
        if (Object.keys(patch).length) {
            await this.carts.update(cart.id, patch);
        }

        return this.toPublic(cart.id, actor?.id);
    }

    async setDeliveryGeo(
        req: Request,
        res: Response,
        actor: CartActor,
        input: { latitude: number; longitude: number },
    ): Promise<PublicCart> {
        const cart = await this.resolveCart(req, res, actor, { createIfMissing: false });
        await this.carts.update(cart.id, {
            deliveryLatitude: input.latitude,
            deliveryLongitude: input.longitude,
        });
        return this.toPublic(cart.id, actor?.id);
    }

    async patchItem(
        req: Request,
        res: Response,
        actor: CartActor,
        itemId: string,
        quantity: number,
    ): Promise<PublicCart> {
        const cart = await this.resolveCart(req, res, actor, { createIfMissing: false });
        const item = await this.carts.findItemById(itemId);
        if (!item || item.cartId !== cart.id) {
            throw ApiError.notFound("cart item not found");
        }
        await this.carts.updateItemQuantity(itemId, quantity);
        await this.clearCoupon(cart.id);
        return this.toPublic(cart.id, actor?.id);
    }

    async removeItem(
        req: Request,
        res: Response,
        actor: CartActor,
        itemId: string,
    ): Promise<PublicCart> {
        const cart = await this.resolveCart(req, res, actor, { createIfMissing: false });
        const item = await this.carts.findItemById(itemId);
        if (!item || item.cartId !== cart.id) {
            throw ApiError.notFound("cart item not found");
        }
        await this.carts.deleteItem(itemId);
        await this.clearCoupon(cart.id);
        return this.toPublic(cart.id, actor?.id);
    }

    async setLocation(
        req: Request,
        res: Response,
        actor: CartActor,
        input: CartLocationInput,
    ): Promise<PublicCart> {
        const cart = await this.resolveCart(req, res, actor, { createIfMissing: true });
        const cityId = await this.resolveCityId(input);
        const pincode = input.pincode?.trim() || null;
        await this.carts.update(cart.id, { cityId, pincode });
        await this.clearCoupon(cart.id);

        const loaded = await this.carts.loadWithItems(cart.id);
        if (!loaded) throw ApiError.notFound("cart not found");

        for (const item of loaded.items) {
            const addonSelections = selectionsFromCartAddonRows(item.addons);
            try {
                await priceQuote(item.productId, cityId, addonSelections);
            } catch {
                await this.carts.deleteItem(item.id);
            }
        }

        return this.toPublic(cart.id, actor?.id);
    }

    async applyCoupon(
        req: Request,
        res: Response,
        actor: CartActor,
        code: string,
    ): Promise<PublicCart> {
        const cart = await this.resolveCart(req, res, actor, { createIfMissing: false });
        const built = await this.buildCartPricing(cart.id);
        if (!built.cityId) {
            throw ApiError.badRequest("select a city before applying a coupon");
        }
        if (built.lines.length === 0) {
            throw ApiError.badRequest("add items to your bag before applying a coupon");
        }

        const validated = await promotionService.validateAndCompute({
            code,
            cityId: built.cityId,
            subtotalPaise: built.subtotalPaise,
            lines: built.lines,
            userId: actor?.id,
            requirePaymentMethod: false,
        });

        await this.carts.update(cart.id, {
            appliedCouponId: validated.coupon.id,
            appliedCouponCode: validated.coupon.code,
        });

        return this.toPublic(cart.id, actor?.id);
    }

    async removeCoupon(req: Request, res: Response, actor: CartActor): Promise<PublicCart> {
        const cart = await this.resolveCart(req, res, actor, { createIfMissing: false });
        await this.clearCoupon(cart.id);
        return this.toPublic(cart.id, actor?.id);
    }

    async merge(req: Request, res: Response, actor: { id: string }): Promise<PublicCart> {
        await this.mergeGuestIntoUser(req, res, actor.id);
        const cart = await this.carts.findByUserId(actor.id);
        if (!cart) {
            const created = await this.carts.insert({
                userId: actor.id,
                guestKey: null,
                expiresAt: null,
            });
            return this.toPublic(created.id, actor.id);
        }
        return this.toPublic(cart.id, actor.id);
    }

    private async mergeGuestIntoUser(req: Request, res: Response, userId: string): Promise<void> {
        const guestKey = readGuestKey(req);
        if (!guestKey) return;

        const guest = await this.carts.findByGuestKey(guestKey);
        clearGuestCookie(res);
        if (!guest) return;

        let userCart = await this.carts.findByUserId(userId);
        if (!userCart) {
            await this.carts.update(guest.id, {
                userId,
                guestKey: null,
                expiresAt: null,
            });
            return;
        }

        if (guest.id === userCart.id) {
            await this.carts.update(guest.id, { guestKey: null, expiresAt: null });
            return;
        }

        const guestLoaded = await this.carts.loadWithItems(guest.id);
        if (!guestLoaded) {
            await this.carts.delete(guest.id);
            return;
        }

        if (!userCart.cityId && guest.cityId) {
            await this.carts.update(userCart.id, {
                cityId: guest.cityId,
                pincode: guest.pincode,
                scheduledAt: guest.scheduledAt ?? userCart.scheduledAt,
            });
            userCart = (await this.carts.findById(userCart.id)) ?? userCart;
        }

        for (const item of guestLoaded.items) {
            const existing = await this.carts.findItem(userCart.id, item.productId);
            if (existing) {
                const qty = Math.max(existing.quantity, item.quantity);
                await this.carts.updateItemQuantity(existing.id, qty);
                const existingAddons = await this.carts.listItemAddons(existing.id);
                const merged = mergeAddonSelections(existingAddons, item.addons);
                await this.carts.replaceItemAddons(existing.id, merged);
            } else {
                const created = await this.carts.upsertItem(userCart.id, item.productId, item.quantity);
                await this.carts.replaceItemAddons(
                    created.id,
                    selectionsFromCartAddonRows(item.addons),
                );
            }
        }

        await this.carts.delete(guest.id);
    }

    private async resolveCart(
        req: Request,
        res: Response,
        actor: CartActor,
        opts: { createIfMissing: boolean },
    ): Promise<Cart> {
        if (actor?.id) {
            let cart = await this.carts.findByUserId(actor.id);
            if (!cart && opts.createIfMissing) {
                cart = await this.carts.insert({
                    userId: actor.id,
                    guestKey: null,
                    expiresAt: null,
                });
            }
            if (!cart) throw ApiError.notFound("cart not found");
            return cart;
        }

        let guestKey = readGuestKey(req);
        if (guestKey) {
            const existing = await this.carts.findByGuestKey(guestKey);
            if (existing) {
                if (existing.expiresAt && existing.expiresAt.getTime() < Date.now()) {
                    await this.carts.delete(existing.id);
                } else {
                    return existing;
                }
            }
        }

        if (!opts.createIfMissing) {
            throw ApiError.notFound("cart not found");
        }

        guestKey = randomUUID();
        const expiresAt = new Date(Date.now() + GUEST_TTL_MS);
        const cart = await this.carts.insert({
            userId: null,
            guestKey,
            expiresAt,
        });
        setGuestCookie(res, guestKey);
        return cart;
    }

    private async ensureCity(
        cart: Cart,
        input: { cityId?: string; pincode?: string },
    ): Promise<string> {
        if (input.pincode || input.cityId) {
            const cityId = await this.resolveCityId(input);
            const pincode = input.pincode?.trim() || cart.pincode;
            await this.carts.update(cart.id, { cityId, pincode });
            return cityId;
        }
        if (cart.cityId) return cart.cityId;
        throw ApiError.badRequest("select a city or pincode before adding to bag");
    }

    private async resolveCityId(input: { cityId?: string; pincode?: string }): Promise<string> {
        const pincode = input.pincode?.trim();
        if (input.cityId) {
            const city = await getActiveCityById(input.cityId);
            if (pincode) {
                await assertDeliveryLocation({ cityId: city.id, pincode });
            }
            return city.id;
        }
        if (pincode) {
            const lookup = await lookupPincode(pincode);
            if (!lookup.deliverable || !lookup.city) {
                throw ApiError.badRequest("pincode not serviceable");
            }
            return lookup.city.id;
        }
        throw ApiError.badRequest("pincode or cityId is required");
    }

    private async clearCoupon(cartId: string): Promise<void> {
        await this.carts.update(cartId, {
            appliedCouponId: null,
            appliedCouponCode: null,
        });
    }

    private async buildCartPricing(cartId: string): Promise<{
        cityId: string | null;
        subtotalPaise: number;
        lines: PromotionLine[];
        items: PublicCartItem[];
        itemCount: number;
        appliedCouponId: string | null;
        appliedCouponCode: string | null;
        pincode: string | null;
        fulfillmentType: "scheduled" | "instant" | null;
        deliveryLatitude: number | null;
        deliveryLongitude: number | null;
        scheduledAt: string | null;
    }> {
        const loaded = await this.carts.loadWithItems(cartId);
        if (!loaded) throw ApiError.notFound("cart not found");

        const items: PublicCartItem[] = [];
        const lines: PromotionLine[] = [];
        let subtotalPaise = 0;
        let itemCount = 0;

        for (const item of loaded.items) {
            const addonSelections = selectionsFromCartAddonRows(item.addons);
            if (!loaded.cityId) {
                const row = await this.products.findById(item.productId);
                items.push({
                    id: item.id,
                    productId: item.productId,
                    name: row?.name ?? "Product",
                    imageUrl: null,
                    quantity: item.quantity,
                    productPaise: 0,
                    addonsPaise: 0,
                    lineTotalPaise: 0,
                    paymentCod: row?.paymentCod ?? true,
                    paymentOnline: row?.paymentOnline ?? false,
                    addons: await this.addonLabels(addonSelections, {}),
                });
                itemCount += item.quantity;
                continue;
            }

            try {
                const quote = await priceQuote(item.productId, loaded.cityId, addonSelections);
                const product = await getProductForCity(item.productId, loaded.cityId);
                const imageUrl =
                    product.images?.find((img) => img.kind === "image")?.url ??
                    product.images?.[0]?.url ??
                    null;

                const unitPriceByAddon: Record<string, number> = {};
                for (const { addonId } of addonSelections) {
                    const single = await priceQuote(item.productId, loaded.cityId, [
                        { addonId, quantity: 1 },
                    ]);
                    unitPriceByAddon[addonId] = single.addonsPaise;
                }

                const lineTotalPaise = quote.totalPaise * item.quantity;
                subtotalPaise += lineTotalPaise;
                itemCount += item.quantity;
                lines.push({
                    productId: item.productId,
                    categoryId: product.categoryId,
                    lineTotalPaise,
                });
                items.push({
                    id: item.id,
                    productId: item.productId,
                    name: product.name,
                    imageUrl,
                    quantity: item.quantity,
                    productPaise: quote.productPaise,
                    addonsPaise: quote.addonsPaise,
                    lineTotalPaise,
                    paymentCod: product.paymentCod,
                    paymentOnline: product.paymentOnline,
                    addons: await this.addonLabels(addonSelections, unitPriceByAddon),
                });
            } catch {
                await this.carts.deleteItem(item.id);
            }
        }

        return {
            cityId: loaded.cityId,
            subtotalPaise,
            lines,
            items,
            itemCount,
            appliedCouponId: loaded.appliedCouponId,
            appliedCouponCode: loaded.appliedCouponCode,
            pincode: loaded.pincode,
            fulfillmentType: loaded.fulfillmentType ?? null,
            deliveryLatitude: loaded.deliveryLatitude ?? null,
            deliveryLongitude: loaded.deliveryLongitude ?? null,
            scheduledAt: loaded.scheduledAt ? loaded.scheduledAt.toISOString() : null,
        };
    }

    private async toPublic(cartId: string, userId?: string): Promise<PublicCart> {
        const built = await this.buildCartPricing(cartId);
        let discountPaise = 0;
        let appliedCoupon: PublicAppliedCoupon | null = null;

        if (built.appliedCouponId && built.cityId && built.lines.length > 0) {
            try {
                const validated = await promotionService.validateAppliedCoupon(built.appliedCouponId, {
                    cityId: built.cityId,
                    subtotalPaise: built.subtotalPaise,
                    lines: built.lines,
                    userId,
                    requirePaymentMethod: false,
                });
                discountPaise = validated.discountPaise;
                const targetLabels = await resolveCouponTargetLabels(
                    validated.coupon.scope,
                    validated.targets,
                );
                let cityName: string | null = null;
                if (validated.coupon.cityId) {
                    const city = await getActiveCityById(validated.coupon.cityId);
                    cityName = city?.name ?? null;
                }
                appliedCoupon = {
                    code: validated.coupon.code,
                    name: validated.coupon.name,
                    description: validated.coupon.description,
                    eligibilitySummary: buildCouponEligibilitySummary(validated.coupon, {
                        cityName,
                        targets: targetLabels,
                    }),
                };
            } catch {
                await this.clearCoupon(cartId);
            }
        }

        const items = await enrichCartItemsWithAddonImages(built.items);

        return {
            id: cartId,
            cityId: built.cityId,
            pincode: built.pincode,
            fulfillmentType: built.fulfillmentType,
            deliveryLatitude: built.deliveryLatitude,
            deliveryLongitude: built.deliveryLongitude,
            scheduledAt: built.scheduledAt,
            itemCount: built.itemCount,
            subtotalPaise: built.subtotalPaise,
            discountPaise,
            totalPaise: Math.max(0, built.subtotalPaise - discountPaise),
            appliedCoupon,
            items,
        };
    }

    private async addonLabels(
        selections: AddonSelection[],
        unitPriceByAddon: Record<string, number>,
    ): Promise<PublicCartAddon[]> {
        const rows: PublicCartAddon[] = [];
        for (const { addonId, quantity } of selections) {
            const addon = await this.addons.findById(addonId);
            const unit = unitPriceByAddon[addonId] ?? 0;
            rows.push({
                id: addonId,
                name: addon?.name ?? "Add-on",
                pricePaise: unit * quantity,
                quantity,
                imageUrl: null,
            });
        }
        return rows;
    }
}
