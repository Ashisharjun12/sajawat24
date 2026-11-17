import { useSyncExternalStore } from "react";
import { AccountHomeMobile } from "@/module/account/components/AccountHomeMobile";
import { ProfilePage } from "@/module/account/pages/ProfilePage";

const MD_DOWN_MEDIA_QUERY = "(max-width: 767px)";

function useIsMdDown() {
  return useSyncExternalStore(
    (listener) => {
      const mq = window.matchMedia(MD_DOWN_MEDIA_QUERY);
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    },
    () => window.matchMedia(MD_DOWN_MEDIA_QUERY).matches,
    () => false,
  );
}

/**
 * /account index. Phones get the user app Account tab (card, shortcuts, menu groups);
 * md+ keeps the profile details page next to the sidebar.
 */
export function AccountPage() {
  const isMdDown = useIsMdDown();
  return isMdDown ? <AccountHomeMobile /> : <ProfilePage />;
}
