import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { scrollToTop } from "@/lib/scroll-to-top";

const SHOW_AFTER_PX = 320;

export function ScrollToTopButton() {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, "change", (value) => {
    setVisible(value > SHOW_AFTER_PX);
  });

  return (
    <Button
      type="button"
      variant="default"
      size="icon"
      aria-label="Scroll to top"
      onClick={() => scrollToTop({ behavior: "smooth" })}
      className={cn(
        "fixed bottom-[calc(1.5rem+var(--mobile-bottom-nav-offset,0px))] left-4 z-40 size-12 rounded-full border-0 bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary/20 transition-[opacity,transform,box-shadow,bottom] duration-200 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 md:bottom-6 md:left-6",
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0",
      )}
    >
      <ArrowUp className="size-5 stroke-[2.5]" aria-hidden />
    </Button>
  );
}
