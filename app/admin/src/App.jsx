import { useEffect } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { Toaster } from "@/components/ui/toast"
import {
  AdminHomeRedirect,
  GuestOnly,
  RequireAdmin,
  RequireAdminSetupComplete,
} from "@/module/auth/guards"
import { hydrateAuth } from "@/module/auth/hydrate"
import { LoginPage } from "@/module/auth/pages/LoginPage"
import { VerifyEmailChangePage } from "@/module/auth/pages/VerifyEmailChangePage"
import { Layout } from "@/module/layout/Layout"
import { DashboardPage } from "@/module/geo/pages/DashboardPage"
import { LocationsPage } from "@/module/geo/pages/LocationsPage"
import { MediaPage } from "@/module/media/pages/MediaPage"
import { CatalogPage } from "@/module/catalog/pages/CatalogPage"
import { ProductFormPage } from "@/module/catalog/pages/ProductFormPage"
import { AddonFormPage } from "@/module/catalog/pages/AddonFormPage"
import { BookingsPage } from "@/module/bookings/pages/BookingsPage"
import { BookingDetailPage } from "@/module/bookings/pages/BookingDetailPage"
import { CreateBookingPage } from "@/module/bookings/pages/CreateBookingPage"
import { PeoplePage } from "@/module/people/pages/PeoplePage"
import { CustomerDetailPage } from "@/module/people/pages/CustomerDetailPage"
import { VendorDetailPage } from "@/module/people/pages/VendorDetailPage"
import { SettingsPage } from "@/module/settings/pages/SettingsPage"
import { PayoutsPage } from "@/module/payouts/pages/PayoutsPage"
import { PromotionsPage } from "@/module/promotions/pages/PromotionsPage"
import { ReviewsPage } from "@/module/reviews/pages/ReviewsPage"
import { ProductReviewsAdminPage } from "@/module/reviews/pages/ProductReviewsAdminPage"
import { AdminShell } from "@/module/layout/AdminShell"
import { InboxPage } from "@/module/inbox/pages/InboxPage"
import { ContentPage } from "@/module/cms/pages/ContentPage"
import { BrandSettingsPage } from "@/module/brand/pages/BrandSettingsPage"
import { BrandPageFormPage } from "@/module/brand/pages/BrandPageFormPage"
import { NotFoundPage } from "@/module/layout/pages/NotFoundPage"

export default function App() {
  useEffect(() => {
    void hydrateAuth()
  }, [])

  return (
    <Toaster>
      <BrowserRouter>
        <Routes>
          <Route element={<GuestOnly />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>
          <Route path="/verify-email-change" element={<VerifyEmailChangePage />} />
          <Route element={<RequireAdmin />}>
            <Route element={<AdminShell />}>
            <Route element={<RequireAdminSetupComplete />}>
            <Route element={<Layout />}>
              <Route index element={<AdminHomeRedirect />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/locations" element={<LocationsPage />} />
              <Route path="/media" element={<MediaPage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/content" element={<ContentPage />} />
              <Route path="/brand" element={<BrandSettingsPage />} />
              <Route path="/brand/pages/:id" element={<BrandPageFormPage />} />
              <Route path="/catalog/products/new" element={<ProductFormPage />} />
              <Route path="/catalog/products/:id/reviews" element={<ProductReviewsAdminPage />} />
              <Route path="/catalog/products/:id" element={<ProductFormPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/catalog/addons/new" element={<AddonFormPage />} />
              <Route path="/catalog/addons/:id" element={<AddonFormPage />} />
              <Route path="/promotions" element={<PromotionsPage />} />
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/bookings/new" element={<CreateBookingPage />} />
              <Route path="/bookings/:orderId" element={<BookingDetailPage />} />
              <Route path="/people" element={<PeoplePage />} />
              <Route path="/people/customers/:customerId" element={<CustomerDetailPage />} />
              <Route path="/people/vendors/:vendorId" element={<VendorDetailPage />} />
              <Route path="/payouts" element={<PayoutsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/inbox/:conversationId" element={<InboxPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
            </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </Toaster>
  )
}
