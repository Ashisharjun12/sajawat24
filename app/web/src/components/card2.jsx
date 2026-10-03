import { useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, PhoneIcon } from "lucide-react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { googleLogin, requestOtp, verifyOtp } from "@/api/auth.api";
import { getApiError } from "@/api/api";
import { DecoryLogo } from "@/components/decory-logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import {
  ensureGoogleGis,
  promptGoogleSignIn,
  renderGoogleButton,
  setGoogleCredentialHandler,
} from "@/lib/google-gis";
import { applyCustomerSession } from "@/module/auth/hydrate";
import {
  formatPhonePreview,
  isValidIndianMobile,
  RESEND_SECONDS,
} from "@/module/auth/phone-login";
import { cn } from "@/lib/utils";
import { useSiteShell } from "@/module/site/hooks/use-site-shell.jsx";

function GoogleMark({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function LoginCard({ embedded = false }) {
  const { brand } = useSiteShell();
  const companyName = brand.companyName || "Decoryy";
  const overlayRef = useRef(null);
  const pendingRef = useRef(false);
  const verifyRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [overlayReady, setOverlayReady] = useState(false);
  const [phoneStep, setPhoneStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setResendSeconds((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  useEffect(() => {
    let cancelled = false;

    async function onCredential(idToken) {
      if (pendingRef.current) {
        return;
      }
      pendingRef.current = true;
      setPending(true);
      try {
        const payload = await googleLogin({ idToken });
        await applyCustomerSession(payload);
      } catch (err) {
        toast.add({ title: getApiError(err), type: "error" });
      } finally {
        pendingRef.current = false;
        setPending(false);
      }
    }

    setGoogleCredentialHandler(onCredential);

    let observer = null;

    function mountOverlay() {
      const el = overlayRef.current;
      if (cancelled || !el || el.offsetWidth < 8) {
        return false;
      }
      renderGoogleButton(el);
      setOverlayReady(true);
      return true;
    }

    ensureGoogleGis()
      .then(() => {
        if (cancelled) {
          return;
        }
        if (mountOverlay()) {
          return;
        }
        const el = overlayRef.current;
        if (!el || typeof ResizeObserver === "undefined") {
          requestAnimationFrame(mountOverlay);
          return;
        }
        observer = new ResizeObserver(() => {
          if (mountOverlay() && observer) {
            observer.disconnect();
            observer = null;
          }
        });
        observer.observe(el);
      })
      .catch(() => {
        if (!cancelled) {
          setOverlayReady(false);
        }
      });

    return () => {
      cancelled = true;
      observer?.disconnect();
      setGoogleCredentialHandler(null);
    };
  }, []);

  async function onGoogleClick() {
    if (pendingRef.current) {
      return;
    }
    setPending(true);
    try {
      const idToken = await promptGoogleSignIn();
      pendingRef.current = true;
      const payload = await googleLogin({ idToken });
      await applyCustomerSession(payload);
    } catch (err) {
      if (err?.code === "PROMPT_BLOCKED" && overlayRef.current) {
        try {
          await ensureGoogleGis();
          renderGoogleButton(overlayRef.current);
          setOverlayReady(true);
          toast.add({
            title: "Tap Continue with Google again",
            type: "info",
          });
        } catch (setupErr) {
          toast.add({ title: getApiError(setupErr), type: "error" });
        }
        return;
      }
      toast.add({ title: getApiError(err), type: "error" });
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  async function sendOtp() {
    if (pendingRef.current || !isValidIndianMobile(phone)) {
      if (!isValidIndianMobile(phone)) {
        toast.add({ title: "Enter a valid 10-digit mobile number", type: "error" });
      }
      return;
    }

    pendingRef.current = true;
    setPending(true);
    try {
      const data = await requestOtp({ phone: phone.trim() });
      setPhoneStep("otp");
      setOtp("");
      setResendSeconds(RESEND_SECONDS);
      if (data.otp) {
        toast.add({ title: `Dev OTP: ${data.otp}`, type: "info" });
      } else {
        toast.add({ title: "OTP sent to your phone", type: "success" });
      }
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" });
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  async function onPhoneSubmit(event) {
    event.preventDefault();
    await sendOtp();
  }

  async function onResendOtp() {
    if (resendSeconds > 0 || pendingRef.current) {
      return;
    }
    await sendOtp();
  }

  async function submitOtp(code) {
    if (verifyRef.current || code.length !== 6) {
      return;
    }

    verifyRef.current = true;
    setPending(true);
    try {
      const payload = await verifyOtp({ phone: phone.trim(), otp: code });
      await applyCustomerSession(payload);
      toast.add({ title: `Welcome to ${companyName}`, type: "success" });
    } catch (err) {
      setOtp("");
      toast.add({ title: getApiError(err), type: "error" });
    } finally {
      verifyRef.current = false;
      setPending(false);
    }
  }

  function onOtpChange(value) {
    setOtp(value);
    if (value.length === 6) {
      submitOtp(value);
    }
  }

  function onBackToPhone() {
    setPhoneStep("phone");
    setOtp("");
    setResendSeconds(0);
  }

  const phonePreview = formatPhonePreview(phone);

  return (
    <Card
      className={cn(
        "w-full shadow-none ring-0",
        embedded ? "gap-0 border-0 bg-transparent" : undefined,
      )}
    >
      <CardHeader
        className={cn(
          "flex w-full flex-col items-center text-center",
          embedded ? "px-5 pt-6 pb-2 pr-12" : undefined,
        )}
      >
        <div className="mb-1 flex items-center gap-2">
          <DecoryLogo
            className="size-9"
            lightSrc={brand.logoLightUrl}
            darkSrc={brand.logoDarkUrl}
            alt={companyName}
          />
          <span className="font-heading text-xl font-extrabold tracking-tight">
            {companyName}
          </span>
        </div>
        <CardTitle className="text-lg sm:text-xl">
          {phoneStep === "phone" ? "Login to your account!" : "Verify your phone"}
        </CardTitle>
        <CardDescription>
          {phoneStep === "phone"
            ? "Continue with Google or your phone number"
            : `Enter the 6-digit code sent to ${phonePreview}`}
        </CardDescription>
      </CardHeader>
      <CardContent className={embedded ? "w-full px-5 pb-8" : undefined}>
        {phoneStep === "phone" ? (
          <>
            <div className="relative h-12 w-full">
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={pending}
                className="h-12 w-full rounded-full text-[15px]"
                onClick={onGoogleClick}
              >
                {pending ? (
                  <Spinner className="size-5" />
                ) : (
                  <GoogleMark className="size-5" />
                )}
                Continue with Google
              </Button>
              <div
                ref={overlayRef}
                className={cn(
                  "absolute inset-0 overflow-hidden rounded-full [&_div]:h-full [&_div]:w-full [&_iframe]:h-full [&_iframe]:w-full",
                  overlayReady && !pending ? "opacity-0" : "pointer-events-none opacity-0",
                )}
                aria-hidden="true"
              />
            </div>
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <span className={cn("px-3", embedded ? "bg-popover" : "bg-card")}>or</span>
              </div>
            </div>
            <form className="flex flex-col gap-3" onSubmit={onPhoneSubmit}>
              <Label htmlFor="login-phone">Phone number</Label>
              <div className="relative">
                <PhoneIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login-phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="98765 43210"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  disabled={pending}
                  className="h-12 pl-10 text-[15px]"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={pending || !isValidIndianMobile(phone)}
                className="h-12 w-full rounded-full text-[15px]"
              >
                {pending ? (
                  <Spinner className="size-5" />
                ) : (
                  <PhoneIcon className="size-5" />
                )}
                Send OTP
              </Button>
            </form>
          </>
        ) : (
          <div className="flex flex-col gap-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-fit self-start px-2 text-muted-foreground"
              onClick={onBackToPhone}
              disabled={pending}
            >
              <ArrowLeftIcon className="size-4" />
              Change number
            </Button>
            <Field>
              <FieldLabel htmlFor="login-otp">One-time password</FieldLabel>
              <FieldDescription>
                New here? We&apos;ll create your account after you verify.
              </FieldDescription>
              <InputOTP
                id="login-otp"
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                value={otp}
                onChange={onOtpChange}
                disabled={pending}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </Field>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                {pending ? "Verifying…" : "Didn't get the code?"}
              </span>
              <Button
                type="button"
                variant="link"
                className="h-auto px-0"
                disabled={pending || resendSeconds > 0}
                onClick={onResendOtp}
              >
                {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : "Resend OTP"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
