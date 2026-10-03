import { WhatsAppIcon } from '@/components/shell/WhatsAppIcon';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  afterModalDismiss,
  copyProductLink,
  productShareMessage,
  productShareUrl,
  shareNative,
  shareViaWhatsApp,
} from '@/lib/share-product';
import { HomeBottomSheetModal } from '@/module/home/components/HomeBottomSheetModal';
import { Copy, Smartphone } from 'lucide-react-native';
import { useMemo } from 'react';
import { Alert, View } from 'react-native';

type ProductShareSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  productId: string;
};

export function ProductShareSheet({
  open,
  onOpenChange,
  title,
  productId,
}: ProductShareSheetProps) {
  const shareUrl = useMemo(() => productShareUrl(productId), [productId]);
  const displayTitle = (title ?? '').trim() || 'Share this setup';

  function close() {
    onOpenChange(false);
  }

  async function onCopy() {
    close();
    await afterModalDismiss();
    try {
      await copyProductLink(shareUrl);
      Alert.alert('Link copied', shareUrl);
    } catch {
      Alert.alert('Could not copy link');
    }
  }

  async function onWhatsApp() {
    const message = productShareMessage(title, shareUrl);
    close();
    await afterModalDismiss();
    await shareViaWhatsApp(message);
  }

  async function onMore() {
    close();
    await afterModalDismiss();
    try {
      await shareNative(title, shareUrl);
    } catch {
      Alert.alert('Could not share');
    }
  }

  return (
    <HomeBottomSheetModal
      visible={open}
      onClose={close}
      closeAccessibilityLabel="Close share">
      <View className="px-5 pt-2 pb-6">
        <Text className="text-foreground text-lg font-semibold">Share</Text>
        <Text className="text-muted-foreground mt-1 text-sm" numberOfLines={2}>
          {displayTitle}
        </Text>
        <Text className="text-muted-foreground mt-3 text-xs" numberOfLines={2} selectable>
          {shareUrl}
        </Text>
        <View className="mt-4 gap-2">
          <Button
            variant="outline"
            className="h-12 flex-row justify-start gap-3 rounded-2xl px-4"
            onPress={() => void onWhatsApp()}>
            <WhatsAppIcon size={20} color="#1DA851" />
            <Text className="text-foreground text-sm font-medium">WhatsApp</Text>
          </Button>
          <Button
            variant="outline"
            className="h-12 flex-row justify-start gap-3 rounded-2xl px-4"
            onPress={() => void onCopy()}>
            <Icon as={Copy} className="size-5 text-foreground" />
            <Text className="text-foreground text-sm font-medium">Copy link</Text>
          </Button>
          <Button
            variant="outline"
            className="h-12 flex-row justify-start gap-3 rounded-2xl px-4"
            onPress={() => void onMore()}>
            <Icon as={Smartphone} className="size-5 text-foreground" />
            <Text className="text-foreground text-sm font-medium">More options</Text>
          </Button>
        </View>
      </View>
    </HomeBottomSheetModal>
  );
}
