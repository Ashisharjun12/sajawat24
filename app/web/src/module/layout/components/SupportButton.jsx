import { Link } from "react-router-dom";
import { HeadphonesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SupportButton() {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="hidden sm:inline-flex"
      nativeButton={false}
      render={<Link to="/support" />}
    >
      <HeadphonesIcon />
      <span className="sr-only">Support</span>
    </Button>
  );
}
