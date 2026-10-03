import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoginCard } from "@/components/card2";
import { useAuthStore } from "@/store/auth.store";

export function LoginDialog() {
  const loginOpen = useAuthStore((s) => s.loginOpen);
  const setLoginOpen = useAuthStore((s) => s.setLoginOpen);

  return (
    <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
      <DialogContent
        className="top-1/2 left-1/2 flex max-h-[min(92dvh,40rem)] w-[calc(100%-2rem)] max-w-[24rem] -translate-x-1/2 -translate-y-1/2 flex-col gap-0 overflow-x-hidden overflow-y-auto p-0 sm:max-w-sm"
      >
        <DialogTitle className="sr-only">Login to your account</DialogTitle>
        <DialogDescription className="sr-only">
          Sign in with Google or phone number
        </DialogDescription>
        {loginOpen ? <LoginCard embedded /> : null}
      </DialogContent>
    </Dialog>
  );
}
