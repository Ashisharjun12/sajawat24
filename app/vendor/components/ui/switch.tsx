import { cn } from '@/lib/utils';
import * as SwitchPrimitives from '@rn-primitives/switch';
import { Platform } from 'react-native';

type SwitchSize = 'default' | 'lg';

const switchSizeStyles: Record<
  SwitchSize,
  { root: string; thumb: string; thumbChecked: string }
> = {
  default: {
    root: 'h-[1.15rem] w-8',
    thumb: 'size-4',
    thumbChecked: 'translate-x-3.5',
  },
  lg: {
    root: 'h-8 w-14',
    thumb: 'size-7',
    thumbChecked: 'translate-x-[1.375rem]',
  },
};

function Switch({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<typeof SwitchPrimitives.Root> & { size?: SwitchSize }) {
  const styles = switchSizeStyles[size];

  return (
    <SwitchPrimitives.Root
      className={cn(
        'flex shrink-0 flex-row items-center rounded-full border border-transparent shadow-sm shadow-black/5',
        styles.root,
        Platform.select({
          web: 'focus-visible:border-ring focus-visible:ring-ring/50 peer inline-flex outline-none transition-all focus-visible:ring-[3px] disabled:cursor-not-allowed',
        }),
        props.checked ? 'bg-primary' : 'bg-input dark:bg-input/80',
        props.disabled && 'opacity-50',
        className
      )}
      {...props}>
      <SwitchPrimitives.Thumb
        className={cn(
          'bg-background rounded-full transition-transform',
          styles.thumb,
          Platform.select({
            web: 'pointer-events-none block ring-0',
          }),
          props.checked
            ? cn('dark:bg-primary-foreground', styles.thumbChecked)
            : 'dark:bg-foreground translate-x-0'
        )}
      />
    </SwitchPrimitives.Root>
  );
}

export { Switch };
