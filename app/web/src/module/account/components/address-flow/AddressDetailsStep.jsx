import { MapPinIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { sanitizeIndianPhoneInput } from "@/lib/indian-phone";
import { getMapPinIconUrl } from "@/lib/map-env";
import { cn } from "@/lib/utils";
import { useMapsSdkConfig } from "@/lib/use-maps-sdk-config";
import { OlaPinMap } from "@/module/geo/components/OlaPinMap";
import { AddressLabelChips } from "@/module/account/components/address-flow/AddressLabelChips";

/** Indian tricolour (saffron / white / green + navy chakra). */
function IndiaFlag({ className }) {
  return (
    <svg viewBox="0 0 30 20" className={className} role="img" aria-label="India">
      <rect x="0" y="0" width="30" height="6.67" fill="#FF9933" />
      <rect x="0" y="6.67" width="30" height="6.66" fill="#FFFFFF" />
      <rect x="0" y="13.33" width="30" height="6.67" fill="#138808" />
      <circle cx="15" cy="10" r="2.6" fill="none" stroke="#000080" strokeWidth="0.7" />
      <circle cx="15" cy="10" r="0.6" fill="#000080" />
      <rect
        x="0.25"
        y="0.25"
        width="29.5"
        height="19.5"
        fill="none"
        stroke="#E2E8F0"
        strokeWidth="0.5"
      />
    </svg>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="text-xs text-destructive" role="alert">
      {message}
    </p>
  );
}

function Section({ title, children }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function LocationPreview({ form, cityName, pincode, onChangeLocation, disabled }) {
  const { config: sdkConfig } = useMapsSdkConfig();
  const pinUrl = getMapPinIconUrl();
  const hasSpot = form.latitude != null && form.longitude != null;

  if (!hasSpot) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-5 py-6 text-center">
        <p className="text-base font-semibold text-foreground">Choose your delivery spot</p>
        <p className="text-sm text-muted-foreground">
          Place the pin on the map first, then add your house details.
        </p>
        <Button type="button" className="w-full" onClick={onChangeLocation}>
          Select on map
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="pointer-events-none relative h-36 overflow-hidden rounded-2xl border border-border bg-muted">
        {sdkConfig ? (
          <>
            <OlaPinMap
              // New coordinates (after "Change") need a fresh camera.
              mapKey={`${form.latitude}:${form.longitude}`}
              sdkConfig={sdkConfig}
              center={{ lat: form.latitude, lng: form.longitude }}
              zoom={17}
              interactive={false}
              className="size-full"
            />
            <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
              <img src={pinUrl} alt="" className="size-10 -translate-y-5 object-contain drop-shadow" />
            </div>
          </>
        ) : null}
      </div>
      <div className="flex items-start gap-3">
        <MapPinIcon className="mt-0.5 size-5 shrink-0 text-foreground" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-foreground">
            {form.areaTitle || cityName || "Delivery location"}
          </p>
          {form.address ? (
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{form.address}</p>
          ) : null}
          {pincode.length === 6 ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {[cityName, pincode].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 border-primary text-primary"
          onClick={onChangeLocation}
          disabled={disabled}
        >
          Change
        </Button>
      </div>
    </div>
  );
}

/**
 * Add address, step 2 (also the edit screen): map preview with "Change", house / building /
 * landmark, a Home / Office / Other label and who receives the setup. Fully controlled by the
 * parent so nothing typed is lost when the user goes back to the map and returns.
 */
export function AddressDetailsStep({
  form,
  onChange,
  labelChoice,
  onLabelChoice,
  customLabel,
  onCustomLabel,
  focusCustomLabel,
  pinTyped,
  onPinTyped,
  pinFromMap,
  pinCheck,
  pincode,
  cityName,
  show,
  touch,
  hasLocation,
  submitLabel,
  submitting,
  onChangeLocation,
  onSubmit,
}) {
  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      noValidate
    >
      <div
        data-lenis-prevent
        className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-5 py-5"
      >
        <LocationPreview
          form={form}
          cityName={cityName}
          pincode={pincode}
          onChangeLocation={onChangeLocation}
          disabled={submitting}
        />

        <Section title="Add address">
          {!pinFromMap ? (
            <div className="flex flex-col gap-1.5">
              <Input
                value={pinTyped}
                onChange={(e) => onPinTyped(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onBlur={() => touch("pincode")}
                placeholder="PIN code"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={6}
                disabled={submitting}
                aria-label="PIN code"
                aria-invalid={Boolean(show("pincode"))}
              />
              {pinCheck.status === "loading" ? (
                <p className="text-xs text-muted-foreground">Checking delivery…</p>
              ) : null}
              {pinCheck.status === "ok" && !show("pincode") ? (
                <p className="text-xs font-medium text-primary">{pinCheck.message}</p>
              ) : null}
              <FieldError message={show("pincode")} />
            </div>
          ) : show("pincode") ? (
            <FieldError message={show("pincode")} />
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Input
              value={form.houseFloor}
              onChange={(e) => onChange({ houseFloor: e.target.value })}
              onBlur={() => touch("houseFloor")}
              placeholder="House No. & Floor"
              maxLength={120}
              autoComplete="address-line1"
              disabled={submitting}
              aria-label="House number and floor"
              aria-invalid={Boolean(show("houseFloor"))}
            />
            <FieldError message={show("houseFloor")} />
          </div>
          <Input
            value={form.buildingBlock}
            onChange={(e) => onChange({ buildingBlock: e.target.value })}
            placeholder="Building & Block No. (Optional)"
            maxLength={120}
            autoComplete="address-line2"
            disabled={submitting}
            aria-label="Building and block number, optional"
          />
          <Input
            value={form.landmark}
            onChange={(e) => onChange({ landmark: e.target.value })}
            placeholder="Landmark & Area Name (Optional)"
            maxLength={200}
            disabled={submitting}
            aria-label="Landmark and area name, optional"
          />
        </Section>

        <Section title="Add address label">
          <AddressLabelChips value={labelChoice} onChange={onLabelChoice} disabled={submitting} />
          {labelChoice === "other" ? (
            <div className="flex flex-col gap-1.5">
              <Input
                value={customLabel}
                onChange={(e) => onCustomLabel(e.target.value)}
                onBlur={() => touch("customLabel")}
                placeholder="Save as (e.g. Mom's place, Studio)"
                maxLength={40}
                autoFocus={focusCustomLabel}
                disabled={submitting}
                aria-label="Custom address name"
                aria-invalid={Boolean(show("customLabel"))}
              />
              <FieldError message={show("customLabel")} />
            </div>
          ) : null}
        </Section>

        <Section title="Add receiver details">
          <div className="flex flex-col gap-1.5">
            <Input
              value={form.receiverName}
              onChange={(e) => onChange({ receiverName: e.target.value })}
              onBlur={() => touch("receiverName")}
              placeholder="Receiver's Name"
              autoComplete="name"
              maxLength={80}
              disabled={submitting}
              aria-label="Receiver's name"
              aria-invalid={Boolean(show("receiverName"))}
            />
            <FieldError message={show("receiverName")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <div
              className={cn(
                "flex h-12 items-center gap-2.5 rounded-(--radius-input) border bg-input/50 px-3.5 transition-[color,box-shadow]",
                show("receiverPhone")
                  ? "border-destructive ring-3 ring-destructive/20"
                  : "border-transparent focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30",
              )}
            >
              <IndiaFlag className="h-4 w-6 shrink-0 rounded-[2px]" />
              <span className="text-base font-medium text-foreground md:text-sm">+91</span>
              <span className="h-5 w-px bg-border" aria-hidden />
              <input
                value={form.receiverPhone}
                onChange={(e) => onChange({ receiverPhone: sanitizeIndianPhoneInput(e.target.value) })}
                onBlur={() => touch("receiverPhone")}
                placeholder="Receiver's Phone Number"
                inputMode="numeric"
                autoComplete="tel-national"
                disabled={submitting}
                aria-label="Receiver's phone number"
                aria-invalid={Boolean(show("receiverPhone"))}
                className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm"
              />
            </div>
            <FieldError message={show("receiverPhone")} />
          </div>
        </Section>

        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3">
          <span className="min-w-0">
            <span className="block text-sm font-medium text-foreground">Set as default address</span>
            <span className="block text-xs text-muted-foreground">Used first at checkout.</span>
          </span>
          <Switch
            checked={form.isDefault}
            onCheckedChange={(next) => onChange({ isDefault: Boolean(next) })}
            disabled={submitting}
            aria-label="Set as default address"
          />
        </label>
      </div>

      <div className="shrink-0 border-t border-border bg-background px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button type="submit" className="h-12 w-full" disabled={submitting || !hasLocation}>
          {submitting ? <Spinner className="size-4" /> : submitLabel}
        </Button>
      </div>
    </form>
  );
}
