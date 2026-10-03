import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/module/home/components/Reveal";

export function HomeCta() {
  return (
    <Reveal className="mx-auto max-w-[1240px] px-4 py-16 md:px-8">
      <div className="rounded-[var(--r-card)] bg-primary px-8 py-14 text-center text-primary-foreground md:px-12">
        <h2 className="font-heading text-[clamp(1.625rem,3.4vw,2.5rem)] font-extrabold tracking-tight">
          Something to celebrate?
        </h2>
        <p className="mt-3 mb-6 text-primary-foreground/90">
          Tell us the date — we&apos;ll handle everything from the first balloon to the last light.
        </p>
        <div className="inline-flex">
          <Button
            variant="cta"
            size="cta"
            nativeButton={false}
            render={<Link to="/c/birthday" />}
          >
            Start planning
          </Button>
        </div>
      </div>
    </Reveal>
  );
}
