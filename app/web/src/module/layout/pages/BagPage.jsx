import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/store/cart.store";

/** Opens the bag drawer and returns home — bag UI lives in CartDrawer. */
export function BagPage() {
  const setOpen = useCartStore((s) => s.setOpen);
  const navigate = useNavigate();

  useEffect(() => {
    setOpen(true);
    navigate("/", { replace: true });
  }, [setOpen, navigate]);

  return null;
}
