import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/module/home/components/Reveal";

export function HomeCta() {
  const reduce = useReducedMotion();

  return (
    <Reveal className="mx-auto max-w-[1240px] px-4 py-16 md:px-8">
      <div className="rounded-[28px] bg-linear-to-br from-primary to-amber-600 px-8 py-14 text-center text-primary-foreground md:px-12">
        <h2 className="font-heading text-[clamp(1.625rem,3.4vw,2.5rem)] font-extrabold tracking-tight">
          Something to celebrate?
        </h2>
        <p className="mt-3 mb-6 text-primary-foreground/90">
          Tell us the date — we&apos;ll handle everything from the first balloon to the last light.
        </p>
        <motion.div
          className="inline-flex"
          whileHover={reduce ? undefined : { y: -2 }}
          whileTap={reduce ? undefined : { scale: 0.98 }}
        >
          <Button
            variant="outline"
            className="rounded-xl border-0 bg-white text-amber-800 hover:bg-white/90"
            nativeButton={false}
            render={<Link to="/c/birthday" />}
          >
            Start planning
          </Button>
        </motion.div>
      </div>
    </Reveal>
  );
}
