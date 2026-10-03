import { cn } from "@/lib/utils";

export function AccountInfoRow({ label, value, action, className }) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-border py-5 first:pt-0",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-1 text-sm text-muted-foreground">{value}</p>
      </div>
      {action ? <div className="shrink-0 pt-0.5">{action}</div> : null}
    </div>
  );
}
