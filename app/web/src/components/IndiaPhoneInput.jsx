import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { phoneDigits } from "@/module/auth/phone-login";
import indiaFlag from "@/assets/world.webp";

const ROUNDED = {
  pill: "rounded-3xl",
  lg: "rounded-lg",
};

export function IndiaPhoneInput({
  id,
  value = "",
  onChange,
  disabled,
  className,
  rounded = "pill",
  placeholder = "10-digit mobile",
  ...props
}) {
  const local = phoneDigits(value).slice(-10);

  function handleChange(event) {
    onChange?.(phoneDigits(event.target.value).slice(0, 10));
  }

  return (
    <div
      className={cn(
        "flex items-center overflow-hidden border bg-input/50 transition-[color,box-shadow,background-color] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30",
        rounded === "lg" ? "border-border/60" : "border-transparent",
        ROUNDED[rounded] ?? ROUNDED.pill,
        disabled && "opacity-50",
        className,
      )}>
      <div
        className="flex shrink-0 items-center gap-2 border-r border-border/60 py-2 pl-3 pr-2.5"
        aria-hidden>
        {rounded === "lg" ? (
          <img
            src={indiaFlag}
            alt=""
            className="size-5 shrink-0 rounded-sm object-cover"
            width={20}
            height={20}
          />
        ) : (
          <span className="text-xl leading-none">🇮🇳</span>
        )}
        <span className="text-sm font-semibold text-foreground">+91</span>
      </div>
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder={placeholder}
        value={local}
        onChange={handleChange}
        disabled={disabled}
        maxLength={10}
        className="rounded-none border-0 bg-transparent shadow-none focus-visible:border-transparent focus-visible:ring-0"
        {...props}
      />
    </div>
  );
}
