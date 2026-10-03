import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";

export function LoginRedirect() {
  const navigate = useNavigate();
  const setLoginOpen = useAuthStore((s) => s.setLoginOpen);

  useEffect(() => {
    setLoginOpen(true);
    navigate("/", { replace: true });
  }, [navigate, setLoginOpen]);

  return null;
}
