import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { scrollToTop } from "@/lib/scroll-to-top";

export function ScrollToTopOnNavigate() {
  const { pathname } = useLocation();

  useEffect(() => {
    scrollToTop({ behavior: "auto" });
  }, [pathname]);

  return null;
}
