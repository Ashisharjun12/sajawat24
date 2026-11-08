import { AnimatedScooter } from '@/components/ui/animated-scooter';
import { Text } from '@/components/ui/text';
import { resolveSectionBadgeBackground } from '@/lib/section-badge-color';
import { useProductMerchBadge } from '@/module/catalog/hooks/use-product-merch-badge';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';

/** Light green chip, green text + scooter. */
const GREEN_CHIP_BG_HEX = '#DCFCE7';
const GREEN_CHIP_TEXT_HEX = '#15803D';
/** Shared with the Verified chip so both line up. */
export const PDP_CHIP_HEIGHT = 22;
/** Very slight corner rounding shared by the PDP chips. */
export const PDP_CHIP_RADIUS = 3;
const CHIP_HEIGHT = PDP_CHIP_HEIGHT;
/** Time each face stays before switching (scooter ride fits inside the Free delivery face). */
const FACE_MS = 2800;

type Face = 'delivery' | 'section';

function FreeDeliveryFace() {
  return (
    <View
      className="flex-row items-center gap-1.5 px-2"
      style={{ height: CHIP_HEIGHT, backgroundColor: GREEN_CHIP_BG_HEX }}>
      <Text
        className="text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: GREEN_CHIP_TEXT_HEX }}>
        Free delivery
      </Text>
      <AnimatedScooter width={18} color={GREEN_CHIP_TEXT_HEX} />
    </View>
  );
}

function SectionFace({ label, color }: { label: string; color: string }) {
  return (
    <View
      className="flex-row items-center gap-1.5 px-2"
      style={{ height: CHIP_HEIGHT, backgroundColor: color }}>
      <Text className="text-[10px] font-semibold uppercase tracking-wide text-white" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Square-corner chip under the PDP title. Shows "FREE DELIVERY" + moving scooter; if the
 * product is in a merch section (Trending, Popular, …) it alternates with that section's
 * badge in a loop — old face slides up and out, new face slides in from below.
 */
export function ProductPdpDeliveryChip({ productId }: { productId?: string | null }) {
  const { badgeLabel, badgeColor } = useProductMerchBadge(productId);
  const sectionLabel = badgeLabel?.trim();
  const [face, setFace] = useState<Face>('delivery');

  useEffect(() => {
    if (!sectionLabel) {
      setFace('delivery');
      return;
    }
    const id = setInterval(() => {
      setFace((f) => (f === 'delivery' ? 'section' : 'delivery'));
    }, FACE_MS);
    return () => clearInterval(id);
  }, [sectionLabel]);

  const showSection = face === 'section' && Boolean(sectionLabel);

  return (
    <Animated.View
      layout={LinearTransition.duration(220)}
      className="overflow-hidden"
      style={{ height: CHIP_HEIGHT, borderRadius: PDP_CHIP_RADIUS }}
      accessibilityLabel={sectionLabel ? `Free delivery. ${sectionLabel}` : 'Free delivery'}>
      <Animated.View
        key={showSection ? 'section' : 'delivery'}
        entering={FadeInDown.duration(260)}
        exiting={FadeOutUp.duration(220)}>
        {showSection ? (
          <SectionFace label={sectionLabel!} color={resolveSectionBadgeBackground(badgeColor)} />
        ) : (
          <FreeDeliveryFace />
        )}
      </Animated.View>
    </Animated.View>
  );
}
