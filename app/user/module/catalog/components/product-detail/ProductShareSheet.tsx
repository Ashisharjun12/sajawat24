import { ScalePressable } from '@/components/shell';
import { WhatsAppIcon } from '@/components/shell/WhatsAppIcon';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatPaise } from '@/lib/format-money';
import { lightImpact } from '@/lib/light-haptic';
import {
  afterModalDismiss,
  copyProductLink,
  productShareMessage,
  productShareUrl,
  shareNative,
  shareViaEmail,
  shareViaFacebook,
  shareViaSms,
  shareViaTelegram,
  shareViaWhatsApp,
} from '@/lib/share-product';
import { cn } from '@/lib/utils';
import { HomeBottomSheetModal } from '@/module/home/components/HomeBottomSheetModal';
import { Image } from 'expo-image';
import { Check, Copy, Link2, Mail, MessageSquareText, MoreHorizontal, Send } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type ProductShareSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  productId: string;
  /** Optional preview at the top of the sheet. */
  imageUrl?: string | null;
  pricePaise?: number | null;
};

const COPIED_MS = 1800;

/** Facebook "f" (lucide has no brand icons). */
function FacebookGlyph() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M14 8.5V6.8c0-.8.2-1.3 1.4-1.3H17V2.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v1.7H7.6v3.3h2.7V21h3.7v-9.2h2.8l.4-3.3H14z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

/** Round app target: coloured circle + label (WhatsApp, Telegram, …). */
function ShareTarget({
  label,
  bg,
  children,
  onPress,
}: {
  label: string;
  bg: string;
  children: ReactNode;
  onPress: () => void;
}) {
  return (
    <ScalePressable
      onPress={onPress}
      haptic
      pressScale={0.94}
      className="w-[68px] items-center gap-1.5"
      accessibilityRole="button"
      accessibilityLabel={`Share via ${label}`}>
      <View className="size-14 items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
        {children}
      </View>
      <Text className="text-foreground text-center text-xs font-medium" numberOfLines={1}>
        {label}
      </Text>
    </ScalePressable>
  );
}

/**
 * Modern share sheet: product preview → link field with inline "Copy"/"Copied" →
 * a row of round app targets (WhatsApp, Telegram, Facebook, Messages, Email, More).
 */
export function ProductShareSheet({
  open,
  onOpenChange,
  title,
  productId,
  imageUrl,
  pricePaise,
}: ProductShareSheetProps) {
  const shareUrl = useMemo(() => productShareUrl(productId), [productId]);
  const displayTitle = (title ?? '').trim() || 'Decoration setup';
  const message = useMemo(() => productShareMessage(title, shareUrl), [title, shareUrl]);
  const linkLabel = shareUrl.replace(/^https?:\/\//, '');

  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    [],
  );

  function close() {
    setCopied(false);
    onOpenChange(false);
  }

  // Copy stays in the sheet: the button flips to "Copied ✓" for a moment, no alert.
  async function onCopy() {
    try {
      await copyProductLink(shareUrl);
      lightImpact();
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      Alert.alert('Could not copy link');
    }
  }

  /** Close first (Linking / Share need the Modal gone on Android), then open the app. */
  async function openAfterClose(action: () => Promise<unknown>) {
    close();
    await afterModalDismiss();
    try {
      await action();
    } catch {
      Alert.alert('Could not share');
    }
  }

  return (
    <HomeBottomSheetModal visible={open} onClose={close} closeAccessibilityLabel="Close share">
      <View className="gap-5 pb-4 pt-1">
        <Text className="text-foreground px-5 text-center text-h3 font-semibold">Share</Text>

        {/* Product preview */}
        <View className="mx-5 flex-row items-center gap-3 rounded-card bg-primary-tint p-3">
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: 56, height: 56, borderRadius: 12 }}
              contentFit="cover"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View className="size-14 items-center justify-center rounded-btn bg-card">
              <Icon as={Link2} className="text-primary size-6" />
            </View>
          )}
          <View className="min-w-0 flex-1 gap-0.5">
            <Text className="text-foreground text-sm font-semibold" numberOfLines={2}>
              {displayTitle}
            </Text>
            {pricePaise != null ? (
              <Text className="text-primary text-sm font-semibold tabular-nums">
                {formatPaise(pricePaise)}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Link + inline copy */}
        <View className="mx-5 flex-row items-center gap-2 rounded-btn border border-border bg-card py-1.5 pl-3.5 pr-1.5">
          <Icon as={Link2} className="text-muted-foreground size-4 shrink-0" />
          <Text className="text-muted-foreground min-w-0 flex-1 text-sm" numberOfLines={1} selectable>
            {linkLabel}
          </Text>
          <ScalePressable
            onPress={() => void onCopy()}
            haptic
            className={cn(
              'h-9 flex-row items-center gap-1.5 rounded-btn px-3.5',
              copied ? 'bg-success' : 'bg-primary',
            )}
            accessibilityRole="button"
            accessibilityLabel={copied ? 'Link copied' : 'Copy link'}
            accessibilityLiveRegion="polite">
            <Icon as={copied ? Check : Copy} className="size-4 text-white" strokeWidth={2.5} />
            <Text className="text-sm font-semibold text-white">{copied ? 'Copied' : 'Copy'}</Text>
          </ScalePressable>
        </View>

        {/* App targets */}
        <View className="gap-2">
          <Text className="text-muted-foreground px-5 text-xs font-semibold uppercase tracking-wider">
            Share via
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-1 px-4">
            <ShareTarget
              label="WhatsApp"
              bg="#25D366"
              onPress={() => void openAfterClose(() => shareViaWhatsApp(message))}>
              <WhatsAppIcon size={26} color="#FFFFFF" />
            </ShareTarget>
            <ShareTarget
              label="Telegram"
              bg="#229ED9"
              onPress={() => void openAfterClose(() => shareViaTelegram(displayTitle, shareUrl))}>
              <Send size={22} color="#FFFFFF" strokeWidth={2.25} />
            </ShareTarget>
            <ShareTarget
              label="Facebook"
              bg="#1877F2"
              onPress={() => void openAfterClose(() => shareViaFacebook(shareUrl))}>
              <FacebookGlyph />
            </ShareTarget>
            <ShareTarget
              label="Messages"
              bg="#34C759"
              onPress={() => void openAfterClose(() => shareViaSms(message))}>
              <MessageSquareText size={22} color="#FFFFFF" strokeWidth={2.25} />
            </ShareTarget>
            <ShareTarget
              label="Email"
              bg="#EA4335"
              onPress={() => void openAfterClose(() => shareViaEmail(displayTitle, message))}>
              <Mail size={22} color="#FFFFFF" strokeWidth={2.25} />
            </ShareTarget>
            <ShareTarget
              label="More"
              bg="#E2ECEA"
              onPress={() => void openAfterClose(() => shareNative(title, shareUrl))}>
              <MoreHorizontal size={24} color="#0F172A" strokeWidth={2.5} />
            </ShareTarget>
          </ScrollView>
        </View>
      </View>
    </HomeBottomSheetModal>
  );
}
