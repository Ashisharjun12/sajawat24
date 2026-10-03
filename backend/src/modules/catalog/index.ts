/**
 * Public API: getProductForCity(), priceQuote() in paise.
 */
import { Router } from "express";
import { CategoryController } from "@/modules/catalog/categories/category.controller.js";
import { CategoryRepository } from "@/modules/catalog/categories/category.repository.js";
import { createCategoryAdminRouter, createCategoryPublicRouter } from "@/modules/catalog/categories/category.route.js";
import { categories } from "@/modules/catalog/categories/category.schema.js";
import { CategoryService } from "@/modules/catalog/categories/category.service.js";
import { ProductController } from "@/modules/catalog/products/product.controller.js";
import { ProductRepository } from "@/modules/catalog/products/product.repository.js";
import { createProductAdminRouter, createProductPublicRouter } from "@/modules/catalog/products/product.route.js";
import { productImages, products } from "@/modules/catalog/products/product.schema.js";
import { ProductService } from "@/modules/catalog/products/product.service.js";
import { AddonController } from "@/modules/catalog/addons/addon.controller.js";
import { AddonRepository } from "@/modules/catalog/addons/addon.repository.js";
import { createAddonAdminRouter } from "@/modules/catalog/addons/addon.route.js";
import { addons, addonColors, productAddons } from "@/modules/catalog/addons/addon.schema.js";
import { AddonService } from "@/modules/catalog/addons/addon.service.js";
import { CityPriceRepository } from "@/modules/catalog/pricing/city-price.repository.js";
import { addonCityPrices, cityPrices } from "@/modules/catalog/pricing/city-price.schema.js";
import { CityPriceService } from "@/modules/catalog/pricing/city-price.service.js";
import { MediaRepository } from "@/modules/upload/media/media.repository.js";
import { CityRepository } from "@/modules/geo/cities/city.repository.js";
import { SectionController } from "@/modules/catalog/sections/section.controller.js";
import { SectionRepository } from "@/modules/catalog/sections/section.repository.js";
import { createSectionAdminRouter, createSectionPublicRouter } from "@/modules/catalog/sections/section.route.js";
import {
    catalogSectionCityOverrides,
    catalogSectionProducts,
    catalogSections,
} from "@/modules/catalog/sections/section.schema.js";
import { SectionService } from "@/modules/catalog/sections/section.service.js";
import { reviewPublicController } from "@/modules/reviews/index.js";
import { createCmsModule } from "@/modules/cms/index.js";
import { createBrandModule } from "@/modules/brand/index.js";

const categoryRepository = new CategoryRepository();
const productRepository = new ProductRepository();
const addonRepository = new AddonRepository();
const cityPriceRepository = new CityPriceRepository();
const mediaRepository = new MediaRepository();

const brandModule = createBrandModule();

const categoryService = new CategoryService(categoryRepository);
const addonService = new AddonService(addonRepository, productRepository);
const cityPriceService = new CityPriceService(cityPriceRepository, productRepository, addonRepository);
const productService = new ProductService(
    productRepository,
    addonRepository,
    cityPriceRepository,
    mediaRepository,
    categoryRepository,
    brandModule.siteBrandService,
);
const cityRepository = new CityRepository();
const sectionRepository = new SectionRepository();
const sectionService = new SectionService(sectionRepository, productService, cityRepository);

const categoryController = new CategoryController(categoryService);
const productController = new ProductController(productService, cityPriceService, addonService);
const addonController = new AddonController(addonService, cityPriceService);
const sectionController = new SectionController(sectionService);

const cmsModule = createCmsModule(
    {
        sectionService,
        sectionRepository,
        categoryService,
        categoryRepository,
    },
    brandModule.cachedSiteShellService,
    brandModule.cachedCmsPageService,
);

export const cmsPublicRouter = cmsModule.cmsPublicRouter;
export const cmsAdminRouter = cmsModule.cmsAdminRouter;
export const brandAdminRouter = brandModule.brandAdminRouter;

export const catalogRouter = Router();
catalogRouter.use("/categories", createCategoryPublicRouter(categoryController));
catalogRouter.use("/products", createProductPublicRouter(productController, reviewPublicController));
catalogRouter.use("/sections", createSectionPublicRouter(sectionController));
catalogRouter.use("/cms", cmsPublicRouter);

export const catalogCategoryAdminRouter = createCategoryAdminRouter(categoryController);
export const catalogProductAdminRouter = createProductAdminRouter(productController);
export const catalogAddonAdminRouter = createAddonAdminRouter(addonController);
export const catalogSectionAdminRouter = createSectionAdminRouter(sectionController);

export function getProductForCity(productId: string, cityId: string) {
    return productService.getForCity(productId, cityId);
}

export function priceQuote(
    productId: string,
    cityId: string,
    selections: import("@/modules/catalog/pricing/addon-selection.js").AddonSelection[],
) {
    return cityPriceService.quote(productId, cityId, selections);
}

export type { AddonSelection } from "@/modules/catalog/pricing/addon-selection.js";
export {
    normalizeAddonSelections,
    selectionsFromCartAddonRows,
} from "@/modules/catalog/pricing/addon-selection.js";

export { categories, products, productImages, addons, addonColors, productAddons, cityPrices, addonCityPrices, catalogSections, catalogSectionCityOverrides, catalogSectionProducts };
