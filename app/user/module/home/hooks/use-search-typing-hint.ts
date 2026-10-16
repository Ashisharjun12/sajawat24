import { useEffect, useState } from 'react';

export const SEARCH_TYPING_PHRASES = [
  'packages',
  'birthday',
  'haldi',
  'anniversary',
  'occasions',
] as const;

const TYPE_MS = 55;
const DELETE_MS = 32;
const HOLD_MS = 2200;
const BETWEEN_MS = 380;

export function useSearchTypingHint(active = true): string {
  const [suffix, setSuffix] = useState('');

  useEffect(() => {
    if (!active) {
      setSuffix('');
      return;
    }

    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    function schedule(ms: number) {
      timer = setTimeout(tick, ms);
    }

    function tick() {
      const phrase = SEARCH_TYPING_PHRASES[phraseIndex] ?? '';

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
    return () => clearTimeout(timer);
  }, [active]);

  return suffix;
}
