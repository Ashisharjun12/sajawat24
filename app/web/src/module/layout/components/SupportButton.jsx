import { Link } from "react-router-dom";
import { HeadphonesIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function SupportButton({ className }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("hidden sm:inline-flex", className)}
      nativeButton={false}
      render={<Link to="/support" />}
    >
      <HeadphonesIcon />
      <span className="sr-only">Support</span>
    </Button>
  );
}
