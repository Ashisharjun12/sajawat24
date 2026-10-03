import { useEffect, useMemo, useState } from "react"
import { addDays, format, isSameDay, startOfToday } from "date-fns"
import { CalendarDaysIcon, CheckIcon, ClockIcon, FlameIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FieldError } from "@/components/ui/field"
import {
  TIME_SLOTS,
  buildScheduledAtFromSlot,
  parseScheduledAtToDateAndSlot,
} from "@/module/bookings/package-picker/package-picker.utils"

const SCROLL_X =
  "flex min-w-0 w-full gap-2 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"

export function PackageSchedulePicker({ value, onChange, error }) {
  const today = useMemo(() => startOfToday(), [])
  const dates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(today, i)), [today])
  const parsed = useMemo(() => parseScheduledAtToDateAndSlot(value), [value])

  const [selectedDate, setSelectedDate] = useState(parsed.date ?? today)
  const [slot, setSlot] = useState(parsed.slotId)
  const [moreOpen, setMoreOpen] = useState(false)
  const inStrip = dates.some((date) => isSameDay(date, selectedDate))

  useEffect(() => {
    if (parsed.date) {
      setSelectedDate(parsed.date)
      setSlot(parsed.slotId)
    }
  }, [parsed.date, parsed.slotId])

  useEffect(() => {
    onChange(buildScheduledAtFromSlot(selectedDate, slot))
  }, [selectedDate, slot])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose date and time</CardTitle>
        <CardDescription>When should we arrive to set up?</CardDescription>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-4">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Select date
          </p>
          <div className={SCROLL_X}>
            {dates.map((date) => {
              const selected = isSameDay(date, selectedDate)
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "flex min-w-14 shrink-0 flex-col items-center rounded-2xl border px-2 py-2 text-xs",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted",
                  )}
                >
                  <span className="uppercase">{format(date, "EEE")}</span>
                  <span className="font-heading text-base font-medium">{format(date, "d")}</span>
                  <span>{format(date, "MMM")}</span>
                </button>
              )
            })}
            <Popover open={moreOpen} onOpenChange={setMoreOpen}>
              <PopoverTrigger
                type="button"
                className={cn(
                  "inline-flex h-auto min-w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border px-2 py-2 text-xs font-medium transition-colors",
                  inStrip
                    ? "border-border bg-background hover:bg-muted"
                    : "border-primary bg-primary text-primary-foreground",
                )}
              >
                <CalendarDaysIcon className="size-4" />
                {inStrip ? "More dates" : format(selectedDate, "d MMM")}
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto p-2">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (!date) return
                    setSelectedDate(date)
                    setMoreOpen(false)
                  }}
                  disabled={{ before: today }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Select time
            </p>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <ClockIcon className="size-3.5" />
              3-hr window
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {TIME_SLOTS.map((item) => {
              const selected = slot === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSlot(item.id)}
                  className={cn(
                    "flex w-full min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border border-black/10 bg-background px-1 py-2 text-center shadow-none transition-colors dark:border-white/15",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-muted/60",
                  )}
                >
                  <span
                    className={cn(
                      "text-[11px] leading-none font-semibold whitespace-nowrap sm:text-xs",
                      selected ? "text-primary-foreground" : "text-foreground",
                    )}
                  >
                    {item.label}
                  </span>
                  {item.fillingFast ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold tracking-wide uppercase",
                        selected
                          ? "bg-white/20 text-primary-foreground"
                          : "bg-rose-600 text-white",
                      )}
                    >
                      <FlameIcon className="size-2.5" />
                      Filling fast
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
          <p className="mt-2.5 flex items-start gap-2 text-xs text-muted-foreground">
            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <CheckIcon className="size-2.5" strokeWidth={3} />
            </span>
            <span>
              Our team{" "}
              <span className="font-medium text-foreground">arrives &amp; completes the setup</span>{" "}
              within your selected time slot.
            </span>
          </p>
        </div>

        {error ? <FieldError errors={[{ message: error }]} /> : null}
      </CardContent>
    </Card>
  )
}
