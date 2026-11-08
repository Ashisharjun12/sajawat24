import { AnimatedScooter } from '@/components/ui/animated-scooter';
import { Text } from '@/components/ui/text';
import { resolveSectionBadgeBackground } from '@/lib/section-badge-color';
import { useProductMerchBadge } from '@/module/catalog/hooks/use-product-merch-badge';
import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react-native';
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

type Face = 'delivery' | 'section' | 'instant';

/** Crimson Instant face (crimson is reserved for Instant surfaces). */
const INSTANT_HEX = '#E11D48';

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

function InstantFace({ label }: { label: string }) {
  return (
    <View
      className="flex-row items-center gap-1 px-2"
      style={{ height: CHIP_HEIGHT, backgroundColor: INSTANT_HEX }}>
      <Zap size={11} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2.5} />
      <Text className="text-[10px] font-semibold uppercase tracking-wide text-white" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

type ProductPdpDeliveryChipProps = {
  productId?: string | null;
  /** When enabled, an "Instant" face joins the rotation. */
  instant?: { enabled?: boolean; badgeLabel?: string | null } | null;
};

/**
 * Square-corner chip under the PDP title. Faces, each shown 2.8s, in a loop:
 * "FREE DELIVERY" + moving scooter → merch section badge (Trending, Popular, …) → Instant.
 * Faces that don't apply are skipped. Old face slides up and out, new one slides in from below.
 */
export function ProductPdpDeliveryChip({ productId, instant }: ProductPdpDeliveryChipProps) {
  const { badgeLabel, badgeColor } = useProductMerchBadge(productId);
  const sectionLabel = badgeLabel?.trim();
  const instantLabel = instant?.enabled
    ? (instant.badgeLabel || 'Instant').trim() || 'Instant'
    : null;

  const faces: Face[] = ['delivery'];
  if (sectionLabel) faces.push('section');
  if (instantLabel) faces.push('instant');
  const faceCount = faces.length;

  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (faceCount < 2) return;
    const id = setInterval(() => setTick((t) => t + 1), FACE_MS);
    return () => clearInterval(id);
  }, [faceCount]);

  // Modulo at render time so a change in face count never points past the list.
  const face = faces[tick % faceCount];

  const a11y = ['Free delivery', sectionLabel, instantLabel].filter(Boolean).join('. ');

  return (
    <Animated.View
      layout={LinearTransition.duration(220)}
      className="overflow-hidden"
      style={{ height: CHIP_HEIGHT, borderRadius: PDP_CHIP_RADIUS }}
      accessibilityLabel={a11y}>
      <Animated.View
        key={face}
        entering={FadeInDown.duration(260)}
        exiting={FadeOutUp.duration(220)}>
        {face === 'section' && sectionLabel ? (
          <SectionFace label={sectionLabel} color={resolveSectionBadgeBackground(badgeColor)} />
        ) : face === 'instant' && instantLabel ? (
          <InstantFace label={instantLabel} />
        ) : (
          <FreeDeliveryFace />
        )}
      </Animated.View>
    </Animated.View>
  );
}
