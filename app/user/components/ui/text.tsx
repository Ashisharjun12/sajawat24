import { MAX_FONT_SCALE } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Platform, Text as RNText, type Role } from 'react-native';

/** Brand type scale — sizes/line heights come from `tailwind.config.js` fontSize. */
const textVariants = cva(
  cn(
    'text-foreground text-body font-normal',
    Platform.select({
      web: 'select-text',
    })
  ),
  {
    variants: {
      variant: {
        default: '',
        display: 'text-display font-semibold',
        h1: 'text-h1 font-semibold',
        h2: 'text-h2 font-semibold',
        h3: 'text-h3 font-semibold',
        h4: 'text-body font-semibold',
        p: 'mt-3 sm:mt-6',
        bodyM: 'text-body font-medium',
        caption: 'text-caption',
        micro: 'text-micro font-medium',
        button: 'text-button font-semibold',
        blockquote: 'mt-4 border-l-2 pl-3 italic sm:mt-6 sm:pl-6',
        code: cn('bg-muted relative rounded-sm px-[0.3rem] py-[0.2rem] font-mono text-caption'),
        lead: 'text-muted-foreground text-h2',
        large: 'text-h3 font-semibold',
        small: 'text-caption font-medium',
        muted: 'text-muted-foreground text-body',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

type TextVariantProps = VariantProps<typeof textVariants>;

type TextVariant = NonNullable<TextVariantProps['variant']>;

const ROLE: Partial<Record<TextVariant, Role>> = {
  display: 'heading',
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  blockquote: Platform.select({ web: 'blockquote' as Role }),
  code: Platform.select({ web: 'code' as Role }),
};

const ARIA_LEVEL: Partial<Record<TextVariant, string>> = {
  display: '1',
  h1: '1',
  h2: '2',
  h3: '3',
  h4: '4',
};

const TextClassContext = React.createContext<string | undefined>(undefined);

function Text({
  className,
  asChild = false,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof RNText> &
  React.RefAttributes<typeof RNText> &
  TextVariantProps & {
    asChild?: boolean;
  }) {
  const textClass = React.useContext(TextClassContext);
  const Component = asChild ? Slot : RNText;
  return (
    <Component
      // Capped so large OS font settings cannot break fixed-height rows.
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      className={cn(textVariants({ variant }), textClass, className)}
      role={variant ? ROLE[variant] : undefined}
      aria-level={variant ? ARIA_LEVEL[variant] : undefined}
      {...props}
    />
  );
}

export { Text, TextClassContext };
