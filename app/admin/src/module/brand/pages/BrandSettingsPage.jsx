import { useSearchParams } from "react-router-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BrandLogoPanel } from "@/module/brand/components/BrandLogoPanel"
import { BrandCompanyPanel } from "@/module/brand/components/BrandCompanyPanel"
import { BrandSocialPanel } from "@/module/brand/components/BrandSocialPanel"
import { BrandFooterPanel } from "@/module/brand/components/BrandFooterPanel"
import { BrandPagesPanel } from "@/module/brand/components/BrandPagesPanel"
import { BrandProductTrustPanel } from "@/module/brand/components/BrandProductTrustPanel"
import { BrandProductInfoPanel } from "@/module/brand/components/BrandProductInfoPanel"

const TABS = ["logo", "catalog", "product-info", "company", "social", "pages", "footer"]

function normalizeTab(value) {
  return TABS.includes(value) ? value : "logo"
}

export function BrandSettingsPage() {
  const [params, setParams] = useSearchParams()
  const tab = normalizeTab(params.get("tab"))

  function onTabChange(next) {
    setParams({ tab: next }, { replace: true })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium tracking-tight">Brand</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Logos, catalog options, default product copy, company copy, social links, site pages, and footer columns.
        </p>
      </div>
      <Tabs value={tab} onValueChange={onTabChange}>
        <TabsList variant="line">
          <TabsTrigger value="logo">Logo</TabsTrigger>
          <TabsTrigger value="catalog">Product gallery</TabsTrigger>
          <TabsTrigger value="product-info">Product info</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="footer">Footer links</TabsTrigger>
        </TabsList>
        <TabsContent value="logo" className="pt-4">
          <BrandLogoPanel />
        </TabsContent>
        <TabsContent value="catalog" className="pt-4">
          <BrandProductTrustPanel />
        </TabsContent>
        <TabsContent value="product-info" className="pt-4">
          <BrandProductInfoPanel />
        </TabsContent>
        <TabsContent value="company" className="pt-4">
          <BrandCompanyPanel />
        </TabsContent>
        <TabsContent value="social" className="pt-4">
          <BrandSocialPanel />
        </TabsContent>
        <TabsContent value="pages" className="pt-4">
          <BrandPagesPanel />
        </TabsContent>
        <TabsContent value="footer" className="pt-4">
          <BrandFooterPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
