import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRightIcon } from "lucide-react";
import { staggerContainer } from "@/lib/motion-variants";
import { Reveal } from "@/module/home/components/Reveal";
import { HomeProductCard } from "@/module/home/components/HomeProductCard";
import { DEMO_PRODUCTS } from "@/module/home/data/demo-products";

export function TrendingGrid() {
  const reduce = useReducedMotion();

  return (
    <Reveal id="trending" className="mx-auto max-w-[1240px] scroll-mt-24 px-4 py-12 md:px-8 md:py-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-5 md:mb-8">
        <div>
          <span className="mb-0.5 block text-[15px] font-bold tracking-wide text-amber-800 italic uppercase dark:text-primary">
            going fast this week
          </span>
          <h2 className="font-heading text-[clamp(1.625rem,3vw,2.25rem)] font-extrabold tracking-tight">
            What everyone&apos;s booking
          </h2>
          <p className="mt-2 max-w-[460px] text-[15px] text-muted-foreground">
            Popular setups this week, priced for the city in your header.
          </p>
        </div>
        <Link
          to="/decorations"
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          View all decorations
          <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <motion.div
        className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-3"
        variants={reduce ? undefined : staggerContainer}
        initial={reduce ? false : "hidden"}
        whileInView={reduce ? undefined : "show"}
        viewport={{ once: true, amount: 0.12 }}
      >
        {DEMO_PRODUCTS.map((product) => (
          <HomeProductCard key={product.id} product={product} />
        ))}
      </motion.div>
    </Reveal>
  );
}
