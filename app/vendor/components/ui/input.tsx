import { MAX_FONT_SCALE } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { Platform, TextInput } from 'react-native';

function Input({
  className,
  onFocus,
  onBlur,
  ...props
}: React.ComponentProps<typeof TextInput> & React.RefAttributes<TextInput>) {
  const [focused, setFocused] = React.useState(false);
  return (
    <TextInput
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      className={cn(
        'border-input bg-surface text-foreground flex h-12 w-full min-w-0 flex-row items-center rounded-input border px-4 text-body font-normal',
        // Native has no :focus, so the 2px primary ring is driven by state.
        focused && 'border-primary border-2 px-[15px]',
        props.editable === false &&
          cn(
            'bg-disabled text-disabled-foreground',
            Platform.select({ web: 'disabled:pointer-events-none disabled:cursor-not-allowed' })
          ),
        Platform.select({
          web: cn(
            'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground outline-none transition-[color,box-shadow]',
            'aria-invalid:border-destructive'
          ),
          native: 'placeholder:text-muted-foreground',
        }),
        className
      )}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      {...props}
    />
  );
}

export { Input };
