import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { hydrateAuth } from "@/module/auth/hydrate";
import { hydrateLocation } from "@/module/geo/hydrate-location";
import { CatalogQuerySync } from "@/module/catalog/components/CatalogQuerySync";
import { useCartStore } from "@/store/cart.store";
import { Layout } from "@/module/layout/Layout";
import { BagPage } from "@/module/layout/pages/BagPage";
import { AccountShell } from "@/module/account/layouts/AccountShell";
import { BookingsPage } from "@/module/account/pages/BookingsPage";
import { BookingChatPage } from "@/module/account/pages/BookingChatPage";
import { ComplaintChatPage } from "@/module/account/pages/ComplaintChatPage";
import { HelpPage } from "@/module/account/pages/HelpPage";
import { HelpTopicChatPage } from "@/module/account/pages/HelpTopicChatPage";
import { BookingDetailPage } from "@/module/account/pages/BookingDetailPage";
import { ProfilePage } from "@/module/account/pages/ProfilePage";
import { NotificationsPage } from "@/module/account/pages/NotificationsPage";
import { AddressesPage } from "@/module/account/pages/AddressesPage";
import { ReturnsRefundsPage } from "@/module/account/pages/ReturnsRefundsPage";
import { CheckoutPage } from "@/module/booking/pages/CheckoutPage";
import { OrderConfirmationPage } from "@/module/booking/pages/OrderConfirmationPage";
import { CategoryPage } from "@/module/catalog/pages/CategoryPage";
import { DecorationsPage } from "@/module/catalog/pages/DecorationsPage";
import { ExplorePage } from "@/module/catalog/pages/ExplorePage";
import { ProductPage } from "@/module/catalog/pages/ProductPage";
import { ProductReviewsPage } from "@/module/catalog/pages/ProductReviewsPage";
import { HomePage } from "@/module/home/pages/HomePage";
import { ServiceCitiesPage } from "@/module/geo/pages/ServiceCitiesPage";
import { CustomerAuthGate } from "@/module/auth/components/CustomerAuthGate";
import { LoginRedirect } from "@/module/layout/pages/LoginRedirect";
import { CmsPagePage } from "@/module/cms/pages/CmsPagePage";
import { OffersPage } from "@/module/promotions/pages/OffersPage";
import { NotFoundPage } from "@/module/layout/pages/NotFoundPage";
import { NotificationsHost } from "@/module/notifications/components/NotificationsHost";
import { SocketProvider } from "@/providers/socket-provider";

export default function App() {
  useEffect(() => {
    void hydrateAuth();
    void hydrateLocation();
    void useCartStore.getState().load().catch(() => {});
  }, []);

  return (
    <SocketProvider>
    <CatalogQuerySync />
    <NotificationsHost />
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/cities" element={<ServiceCitiesPage />} />
          <Route path="/decorations" element={<DecorationsPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/c/:parentSlug" element={<CategoryPage />} />
          <Route path="/c/:parentSlug/:childSlug" element={<CategoryPage />} />
          <Route path="/p/:id/reviews" element={<ProductReviewsPage />} />
          <Route path="/p/:id" element={<ProductPage />} />
          <Route path="/login" element={<LoginRedirect />} />
          <Route path="/account" element={<AccountShell />}>
            <Route index element={<ProfilePage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="orders" element={<Navigate to="/account/bookings" replace />} />
            <Route path="addresses" element={<AddressesPage />} />
            <Route path="returns" element={<ReturnsRefundsPage />} />
            <Route path="bookings/:orderId" element={<BookingDetailPage />} />
            <Route path="bookings/:orderId/chat" element={<BookingChatPage />} />
            <Route path="bookings/:orderId/complaint" element={<ComplaintChatPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="help/:topicKey/chat" element={<HelpTopicChatPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<Navigate to="/account" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="/support" element={<Navigate to="/account/help" replace />} />
          <Route path="/bookings" element={<Navigate to="/account/bookings" replace />} />
          <Route path="/settings" element={<Navigate to="/account" replace />} />
          <Route
            path="/checkout"
            element={
              <CustomerAuthGate
                mode="prompt"
                title="Sign in to checkout"
                description="Use the login dialog to complete your booking."
              >
                <CheckoutPage />
              </CustomerAuthGate>
            }
          />
          <Route
            path="/checkout/success/:orderId"
            element={
              <CustomerAuthGate
                mode="prompt"
                title="Sign in to view your booking"
                description="Your confirmation is tied to your account. Sign in to see order details."
              >
                <OrderConfirmationPage />
              </CustomerAuthGate>
            }
          />
          <Route path="/bag" element={<BagPage />} />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="/pages/:slug" element={<CmsPagePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </SocketProvider>
  );
}
