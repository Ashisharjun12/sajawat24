import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "@/lib/motion-variants";

export function Reveal({ children, className, delay = 0, ...props }) {
  const reduce = useReducedMotion();

  return (
    <motion.section
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.55, delay, ease: EASE }}
      {...props}
    >
      {children}
    </motion.section>
  );
}
