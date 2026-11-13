import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { PartnerMode } from '@/lib/partner-mode';
import { cn } from '@/lib/utils';
import { SwitchPartnerModeSheet } from '@/module/profile/components/SwitchPartnerModeSheet';
import { useAuthStore } from '@/store/auth.store';
import { selectIsFieldShell, usePartnerModeStore } from '@/store/partner-mode.store';
import { Check, ChevronDown, HardHat, Store, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MODE_OPTIONS: { mode: PartnerMode; label: string; icon: LucideIcon }[] = [
  { mode: 'owner', label: 'Vendor mode', icon: Store },
  { mode: 'field', label: 'Worker mode', icon: HardHat },
];

type PartnerModeDropdownProps = {
  className?: string;
};

/**
 * Pill on the green home header showing the current partner mode.
 * Users who can switch get a dropdown; picking the other mode opens the confirm sheet.
 */
export function PartnerModeDropdown({ className }: PartnerModeDropdownProps) {
  const user = useAuthStore((s) => s.user);
  const partnerMode = usePartnerModeStore((s) => s.mode);
  const setPartnerMode = usePartnerModeStore((s) => s.setMode);
  const insets = useSafeAreaInsets();
  const [targetMode, setTargetMode] = useState<PartnerMode | null>(null);
  const [switching, setSwitching] = useState(false);

  const currentMode: PartnerMode = selectIsFieldShell(partnerMode, user) ? 'field' : 'owner';
  const current = MODE_OPTIONS.find((o) => o.mode === currentMode) ?? MODE_OPTIONS[0];
  const canSwitch = !!user?.capabilities?.canSwitchToFieldMode && user?.role !== 'vendor_staff';

  const pillClassName = cn(
    'h-10 flex-row items-center gap-2 rounded-full bg-primary-foreground/15 px-3.5',
    className,
  );

  const pillContent = (
    <>
      <Icon as={current.icon} className="size-4 text-primary-foreground" />
      <Text className="text-sm font-medium text-primary-foreground">{current.label}</Text>
      {canSwitch ? <Icon as={ChevronDown} className="size-4 text-primary-foreground" /> : null}
    </>
  );

  if (!canSwitch) {
    return (
      <View className={pillClassName} accessibilityLabel={`Current mode: ${current.label}`}>
        {pillContent}
      </View>
    );
  }

  async function handleConfirm() {
    if (!targetMode) return;
    setSwitching(true);
    try {
      await setPartnerMode(targetMode);
      setTargetMode(null);
    } finally {
      setSwitching(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={pillClassName}
          accessibilityLabel={`Current mode: ${current.label}. Tap to switch mode`}>
          {pillContent}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          insets={{ top: insets.top, bottom: insets.bottom, left: 12, right: 12 }}
          className="w-52 rounded-2xl p-1.5">
          {MODE_OPTIONS.map((option) => {
            const selected = option.mode === currentMode;
            return (
              <DropdownMenuItem
                key={option.mode}
                className={cn('rounded-xl px-3 py-3', selected && 'bg-primary/10')}
                onPress={() => {
                  if (!selected) setTargetMode(option.mode);
                }}>
                <Icon
                  as={option.icon}
                  className={cn('size-4', selected ? 'text-primary' : 'text-muted-foreground')}
                />
                <Text
                  className={cn(
                    'flex-1 text-sm',
                    selected ? 'font-semibold text-primary' : 'text-foreground',
                  )}>
                  {option.label}
                </Text>
                {selected ? <Icon as={Check} className="size-4 text-primary" /> : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <SwitchPartnerModeSheet
        open={targetMode !== null}
        targetMode={targetMode ?? 'owner'}
        loading={switching}
        onClose={() => {
          if (!switching) setTargetMode(null);
        }}
        onConfirm={() => {
          void handleConfirm();
        }}
      />
    </>
  );
}
