import { useSyncExternalStore } from "react";

const MD_DOWN_MEDIA_QUERY = "(max-width: 767px)";

function subscribe(listener) {
  const mq = window.matchMedia(MD_DOWN_MEDIA_QUERY);
  mq.addEventListener("change", listener);
  return () => mq.removeEventListener("change", listener);
}

function getSnapshot() {
  return window.matchMedia(MD_DOWN_MEDIA_QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

export function useMediaMdDown() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
