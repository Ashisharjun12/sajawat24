import { MAX_FONT_SCALE } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { Platform, TextInput } from 'react-native';

function Textarea({
  className,
  multiline = true,
  numberOfLines = Platform.select({ web: 2, native: 8 }), // On web, numberOfLines also determines initial height. On native, it determines the maximum height.
  placeholderClassName,
  onFocus,
  onBlur,
  ...props
}: React.ComponentProps<typeof TextInput> & React.RefAttributes<TextInput>) {
  const [focused, setFocused] = React.useState(false);
  return (
    <TextInput
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      className={cn(
        'text-foreground border-input bg-surface flex min-h-16 w-full flex-row rounded-input border px-4 py-3 text-body font-normal',
        focused && 'border-primary border-2 px-[15px] py-[11px]',
        Platform.select({
          web: 'placeholder:text-muted-foreground aria-invalid:border-destructive field-sizing-content resize-y outline-none transition-[color,box-shadow] disabled:cursor-not-allowed',
        }),
        props.editable === false && 'bg-disabled text-disabled-foreground',
        className
      )}
      placeholderClassName={cn('text-muted-foreground', placeholderClassName)}
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical="top"
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

export { Textarea };
