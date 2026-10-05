import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Brand scale keys are not t-shirt sizes, so tailwind-merge would otherwise read
 * `text-h1` as a text *color* and drop `text-foreground` next to it. Registering
 * them keeps size/radius/shadow conflicts resolving against the right group.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        { text: ['micro', 'caption', 'body', 'button', 'h3', 'h2', 'h1', 'display'] },
      ],
      rounded: [{ rounded: ['btn', 'input', 'card', 'sheet', 'pill'] }],
      shadow: [{ shadow: ['raised', 'soft', 'soft-lg'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
