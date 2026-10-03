import type { CustomerAddress } from '@/api/addresses.api';
import { ScalePressable } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { HomeBottomSheetModal } from '@/module/home/components/HomeBottomSheetModal';
import { Pencil, Trash2 } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { View } from 'react-native';

type Props = {
  address: CustomerAddress | null;
  open: boolean;
  onClose: () => void;
  onEdit: (address: CustomerAddress) => void;
  onDelete: (address: CustomerAddress) => void;
  deleting?: boolean;
};

export function AddressOptionsSheet({
  address,
  open,
  onClose,
  onEdit,
  onDelete,
  deleting = false,
}: Props) {
  if (!address) return null;

  return (
    <HomeBottomSheetModal visible={open} onClose={onClose} closeAccessibilityLabel="Close address options">
      <View className="gap-4 px-5 pb-2 pt-3">
        <View>
          <Text className="text-foreground text-lg font-semibold">{address.label}</Text>
          <Text className="text-muted-foreground mt-1 text-sm leading-5" numberOfLines={3}>
            {address.address}
            {address.landmark ? `, ${address.landmark}` : ''}
          </Text>
          <Text className="text-muted-foreground mt-0.5 text-xs">
            {address.cityName} · {address.pincode}
          </Text>
        </View>

        <View className="gap-2">
          <ScalePressable
            haptic
            disabled={deleting}
            onPress={() => {
              onClose();
              onEdit(address);
            }}
            className="flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 active:bg-muted/40">
            <View className="size-10 items-center justify-center rounded-full bg-muted">
              <Icon as={Pencil} className="text-foreground size-5" />
            </View>
            <Text className="text-foreground text-base font-semibold">Edit address</Text>
          </ScalePressable>

          <ScalePressable
            haptic
            disabled={deleting}
            onPress={() => {
              onClose();
              onDelete(address);
            }}
            className="flex-row items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3.5 active:bg-destructive/10">
            <View className="size-10 items-center justify-center rounded-full bg-destructive/10">
              <Icon as={Trash2} className="text-destructive size-5" />
            </View>
            <Text className="text-destructive text-base font-semibold">
              {deleting ? 'Deleting…' : 'Delete address'}
            </Text>
          </ScalePressable>
        </View>
      </View>
    </HomeBottomSheetModal>
  );
}
