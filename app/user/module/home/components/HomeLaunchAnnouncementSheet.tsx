import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { openCmsLink } from '@/lib/open-cms-link';
import {
  HomeBottomSheetModal,
} from '@/module/home/components/HomeBottomSheetModal';
import type { HomeAnnouncement } from '@/module/home/lib/announcement';
import {
  announcementAccentHex,
  announcementDisplayCopy,
  announcementHeroImageUrl,
} from '@/module/home/lib/announcement';
import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

type HomeLaunchAnnouncementSheetProps = {
  visible: boolean;
  announcement: HomeAnnouncement | null;
  onDismiss: () => void;
  onPrimaryClose: () => void;
};

function textColorForBg(hex: string): string {
  const normalized = hex.startsWith('#') ? hex : `#${hex}`;
  if (!/^#[0-9a-fA-F]{6}$/.test(normalized)) return '#ffffff';
  const r = Number.parseInt(normalized.slice(1, 3), 16);
  const g = Number.parseInt(normalized.slice(3, 5), 16);
  const b = Number.parseInt(normalized.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? '#111827' : '#ffffff';
}

export function HomeLaunchAnnouncementSheet({
  visible,
  announcement,
  onDismiss,
  onPrimaryClose,
}: HomeLaunchAnnouncementSheetProps) {
  if (!announcement) return null;
  const item = announcement;

  const heroUrl = announcementHeroImageUrl(item);
  const { title, subtitle } = announcementDisplayCopy(item);
  const accent = announcementAccentHex(item);
  const heroTextColor = textColorForBg(accent);
  const ctaLabel = item.ctaLabel?.trim() || 'Try it now';
  const tagLabel = item.tag?.trim() || null;
  const href = item.href;

  function handlePrimary() {
    onPrimaryClose();
    if (href) {
      openCmsLink(href);
    }
  }

  return (
    <HomeBottomSheetModal
      visible={visible}
      onClose={onDismiss}
      closeAccessibilityLabel="Close announcement">
      <View className="gap-4 px-5 pt-1">
        {heroUrl ? (
          <View className="overflow-hidden rounded-2xl bg-muted">
            <Image
              source={{ uri: heroUrl }}
              style={{ width: '100%', aspectRatio: 16 / 10 }}
              contentFit="cover"
              accessibilityLabel={item.alt || title}
            />
          </View>
        ) : (
          <View
            className="items-center justify-center rounded-2xl px-4 py-10"
            style={{ backgroundColor: accent }}>
            <Text className="text-h2 font-semibold" style={{ color: heroTextColor }}>
              {tagLabel || 'NEW'}
            </Text>
          </View>
        )}

        <View className="gap-2">
          <Text className="text-h2 font-semibold text-foreground">{title}</Text>
          {subtitle ? (
            <Text className="text-body leading-6 text-muted-foreground">{subtitle}</Text>
          ) : null}
        </View>

        {href ? (
          <Button
            variant="primary"
            className="h-12 w-full rounded-pill"
            onPress={handlePrimary}>
            <Text>{ctaLabel}</Text>
          </Button>
        ) : (
          <Button
            variant="primary"
            className="h-12 w-full rounded-pill"
            onPress={onPrimaryClose}>
            <Text>Got it</Text>
          </Button>
        )}

        {item.dismissible ? (
          <Pressable
            onPress={onDismiss}
            className="items-center py-2 active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel="Maybe later">
            <Text className="text-body font-medium text-primary">Maybe later</Text>
          </Pressable>
        ) : null}
      </View>
    </HomeBottomSheetModal>
  );
}
