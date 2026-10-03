import { useSearchParams } from "react-router-dom"
import { motion, useReducedMotion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CategoriesPanel } from "@/module/catalog/components/CategoriesPanel"
import { ProductsPanel } from "@/module/catalog/components/ProductsPanel"
import { AddonsPanel } from "@/module/catalog/components/AddonsPanel"
import { SectionsPanel } from "@/module/catalog/components/SectionsPanel"

const TABS = ["products", "categories", "addons", "sections"]

function normalizeTab(value) {
  return TABS.includes(value) ? value : "products"
}

export function CatalogPage() {
  const reduceMotion = useReducedMotion()
  const [params, setParams] = useSearchParams()
  const tab = normalizeTab(params.get("tab"))

  function onTabChange(next) {
    setParams({ tab: next }, { replace: true })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="shrink-0">
        <h1 className="font-heading text-2xl font-medium tracking-tight">Catalog</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Categories, products, add-ons, and sections. Prices live on each product and add-on.
        </p>
      </div>

      <Tabs value={tab} onValueChange={onTabChange} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="shrink-0" variant="line">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="addons">Add-ons</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="min-h-0 flex-1 overflow-auto">
          <motion.div
            key="products"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
          >
            <ProductsPanel />
          </motion.div>
        </TabsContent>
        <TabsContent value="categories" className="min-h-0 flex-1 overflow-auto">
          <motion.div
            key="categories"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
          >
            <CategoriesPanel />
          </motion.div>
        </TabsContent>
        <TabsContent value="addons" className="min-h-0 flex-1 overflow-auto">
          <motion.div
            key="addons"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
          >
            <AddonsPanel />
          </motion.div>
        </TabsContent>
        <TabsContent value="sections" className="min-h-0 flex-1 overflow-auto">
          <motion.div
            key="sections"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
          >
            <SectionsPanel />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
