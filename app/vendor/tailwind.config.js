const { hairlineWidth } = require('nativewind/theme');
const plugin = require('tailwindcss/plugin');

const channel = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/**
 * React Native cannot synthesize weights for a custom family, so `font-semibold`
 * has to swap the Poppins face rather than set `font-weight`. Only 400/500/600 are
 * bundled, so bold/extrabold collapse onto SemiBold.
 */
const poppinsWeights = plugin(({ addUtilities }) => {
  const face = (fontFamily, fontWeight) => ({ fontFamily, fontWeight });
  addUtilities({
    '.font-thin': face('Poppins_400Regular', '400'),
    '.font-extralight': face('Poppins_400Regular', '400'),
    '.font-light': face('Poppins_400Regular', '400'),
    '.font-normal': face('Poppins_400Regular', '400'),
    '.font-medium': face('Poppins_500Medium', '500'),
    '.font-semibold': face('Poppins_600SemiBold', '600'),
    '.font-bold': face('Poppins_600SemiBold', '600'),
    '.font-extrabold': face('Poppins_600SemiBold', '600'),
    '.font-black': face('Poppins_600SemiBold', '600'),
  });
});

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './module/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  corePlugins: {
    // Replaced by `poppinsWeights` so weight classes pick the right Poppins face.
    fontWeight: false,
  },
  theme: {
    extend: {
      colors: {
        border: channel('border'),
        input: channel('input'),
        ring: channel('ring'),
        background: channel('background'),
        foreground: channel('foreground'),
        surface: channel('card'),
        scrim: channel('scrim'),
        primary: {
          DEFAULT: channel('primary'),
          foreground: channel('primary-foreground'),
          dark: channel('primary-dark'),
          tint: channel('primary-tint'),
        },
        cta: {
          DEFAULT: channel('cta'),
          foreground: channel('cta-foreground'),
        },
        instant: {
          DEFAULT: channel('instant'),
          foreground: channel('instant-foreground'),
        },
        success: {
          DEFAULT: channel('success'),
          foreground: channel('success-foreground'),
        },
        disabled: {
          DEFAULT: channel('disabled'),
          foreground: channel('disabled-foreground'),
        },
        secondary: {
          DEFAULT: channel('secondary'),
          foreground: channel('secondary-foreground'),
        },
        destructive: {
          DEFAULT: channel('destructive'),
          foreground: channel('destructive-foreground'),
        },
        muted: {
          DEFAULT: channel('muted'),
          foreground: channel('muted-foreground'),
        },
        accent: {
          DEFAULT: channel('accent'),
          foreground: channel('accent-foreground'),
        },
        popover: {
          DEFAULT: channel('popover'),
          foreground: channel('popover-foreground'),
        },
        card: {
          DEFAULT: channel('card'),
          foreground: channel('card-foreground'),
        },
      },
      fontFamily: {
        sans: ['Poppins_400Regular'],
        medium: ['Poppins_500Medium'],
        semibold: ['Poppins_600SemiBold'],
      },
      fontSize: {
        // Brand type scale (size / line height).
        micro: ['11px', '16px'],
        xs: ['12px', '18px'],
        caption: ['12px', '18px'],
        sm: ['14px', '20px'],
        body: ['14px', '20px'],
        button: ['15px', '20px'],
        base: ['16px', '24px'],
        h3: ['16px', '24px'],
        lg: ['18px', '26px'],
        h2: ['18px', '26px'],
        xl: ['20px', '28px'],
        '2xl': ['22px', '30px'],
        h1: ['22px', '30px'],
        '3xl': ['28px', '36px'],
        '4xl': ['28px', '36px'],
        display: ['28px', '36px'],
      },
      borderRadius: {
        btn: '12px',
        input: '12px',
        card: '16px',
        sheet: '24px',
        pill: '9999px',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
      boxShadow: {
        // Not `card`: that name is also a color, so `shadow-card` would recolor the shadow white.
        raised: '0 4px 12px rgba(15, 23, 42, 0.05)',
        soft: '0 2px 12px rgba(15, 23, 42, 0.06)',
        'soft-lg': '0 8px 24px rgba(15, 23, 42, 0.08)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [require('tailwindcss-animate'), poppinsWeights],
};
