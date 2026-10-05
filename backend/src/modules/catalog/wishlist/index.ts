import type { ProductService } from "@/modules/catalog/products/product.service.js";
import { WishlistController } from "@/modules/catalog/wishlist/wishlist.controller.js";
import { WishlistRepository } from "@/modules/catalog/wishlist/wishlist.repository.js";
import { createWishlistRouter } from "@/modules/catalog/wishlist/wishlist.route.js";
import { WishlistService } from "@/modules/catalog/wishlist/wishlist.service.js";

export { wishlistItems } from "@/modules/catalog/wishlist/wishlist.schema.js";

export function createWishlistRouterForApp(productService: ProductService) {
    const repository = new WishlistRepository();
    const service = new WishlistService(repository, productService);
    const controller = new WishlistController(service);
    return createWishlistRouter(controller);
}
