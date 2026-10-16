import { useEffect, useState } from "react";

/** Rotating suffixes after "Search " — typewriter on closed search triggers only. */
export const SEARCH_TYPING_PHRASES = [
  "packages",
  "birthday",
  "haldi",
  "anniversary",
  "occasions",
];

const TYPE_MS = 55;
const DELETE_MS = 32;
const HOLD_MS = 2200;
const BETWEEN_MS = 380;

export function useSearchTypingHint(active = true) {
  const [suffix, setSuffix] = useState("");

  useEffect(() => {
    if (!active) {
      setSuffix("");
      return undefined;
    }

    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timer;

    function schedule(ms) {
      timer = window.setTimeout(tick, ms);
    }

    function tick() {
      const phrase = SEARCH_TYPING_PHRASES[phraseIndex] ?? "";

      if (!deleting) {
        charIndex += 1;
        setSuffix(phrase.slice(0, charIndex));
        if (charIndex >= phrase.length) {
          deleting = true;
          schedule(HOLD_MS);
          return;
        }
        schedule(TYPE_MS);
        return;
      }

      charIndex -= 1;
      setSuffix(phrase.slice(0, charIndex));
      if (charIndex <= 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % SEARCH_TYPING_PHRASES.length;
        schedule(BETWEEN_MS);
        return;
      }
      schedule(DELETE_MS);
    }

    schedule(BETWEEN_MS);
    return () => window.clearTimeout(timer);
  }, [active]);

  return suffix;
}
