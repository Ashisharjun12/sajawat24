import { useMemo, useState } from "react";
import { getApiError } from "@/api/api";
import { submitOrderReview } from "@/api/reviews.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function StarPicker({ value, onChange, disabled }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {Array.from({ length: 5 }).map((_, index) => {
        const star = index + 1;
        const active = star <= value;
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            className={cn(
              "rounded-md px-1 text-2xl transition-colors",
              active ? "text-amber-500" : "text-muted-foreground/30",
              !disabled && "hover:text-amber-500",
            )}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            aria-checked={value === star}
            role="radio"
            onClick={() => onChange(star)}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

export function WriteBookingReviewDialog({ order, open, onOpenChange, onSubmitted }) {
  const productOptions = useMemo(
    () =>
      (order?.items ?? []).map((item) => ({
        id: item.productId,
        name: item.name,
      })),
    [order?.items],
  );

  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [productId, setProductId] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const needsProductPick = productOptions.length > 1;
  const selectedProductId = needsProductPick ? productId : productOptions[0]?.id;
  const canSubmit =
    rating >= 1 && body.trim().length >= 10 && (!needsProductPick || Boolean(selectedProductId));

  function resetForm() {
    setRating(0);
    setBody("");
    setProductId("");
    setStatus("idle");
    setError("");
  }

  function handleOpenChange(nextOpen) {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!order?.id || !canSubmit || status === "submitting") return;

    setStatus("submitting");
    setError("");
    try {
      const payload = {
        rating,
        body: body.trim(),
      };
      if (needsProductPick) {
        payload.productId = selectedProductId;
      }
      const data = await submitOrderReview(order.id, payload);
      onSubmitted?.(data);
      handleOpenChange(false);
    } catch (err) {
      setError(getApiError(err));
      setStatus("idle");
    }
  }

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-5 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share your experience</DialogTitle>
          <DialogDescription>
            Tell others how your setup went. Verified reviews appear on the product page.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {needsProductPick ? (
            <div className="space-y-2">
              <Label>Which decoration?</Label>
              <Select value={productId} onValueChange={setProductId} disabled={status === "submitting"}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {productOptions.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Rating</Label>
            <StarPicker value={rating} onChange={setRating} disabled={status === "submitting"} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-body">Your review</Label>
            <Textarea
              id="review-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="What did you like? How was the setup quality and timing?"
              rows={5}
              maxLength={2000}
              disabled={status === "submitting"}
            />
            <p className="text-xs text-muted-foreground">At least 10 characters</p>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={status === "submitting"}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || status === "submitting"}>
              {status === "submitting" ? "Submitting…" : "Submit review"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
