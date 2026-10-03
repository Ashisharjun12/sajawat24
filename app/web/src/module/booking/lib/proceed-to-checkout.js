/**
 * Same gate as CartDrawer "Continue to checkout": login required, then /checkout.
 */
export function proceedToCheckout({ user, setLoginOpen, navigate, setCartOpen }) {
  if (!user) {
    setLoginOpen(true);
    return false;
  }
  setCartOpen?.(false);
  navigate("/checkout");
  return true;
}
