import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

/** Ribbon body height (px). */
const RIBBON_HEIGHT = 18;
/** Depth of the swallow-tail notch on the left end. */
const RIBBON_NOTCH = 5;
/** How far the ribbon hangs past the card edge; also the size of the folded tail. */
export const RIBBON_FOLD = 4;

/** Darken a #rrggbb color for the folded tail (the part "behind" the card). */
function darken(hex: string, amount = 0.38) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 'rgba(0,0,0,0.45)';
  const n = parseInt(m[1], 16);
  const ch = (shift: number) =>
    Math.max(0, Math.round(((n >> shift) & 0xff) * (1 - amount)))
      .toString(16)
      .padStart(2, '0');
  return `#${ch(16)}${ch(8)}${ch(0)}`;
}

type RibbonBadgeProps = {
  label: string;
  /** Solid fill, #rrggbb. */
  color: string;
  className?: string;
};

/**
 * Wrap-around ribbon: notched left end, straight right end that overhangs the
 * card edge by `RIBBON_FOLD`, with a darker folded tail underneath. Place it with
 * `right: -RIBBON_FOLD` inside a container that does not clip.
 */
export function RibbonBadge({ label, color, className }: RibbonBadgeProps) {
  const [width, setWidth] = useState(0);
  const h = RIBBON_HEIGHT;
  const f = RIBBON_FOLD;

  return (
    <View
      className={cn('justify-center', className)}
      style={{ height: h + f, paddingLeft: RIBBON_NOTCH + 4, paddingRight: 7, paddingBottom: f }}
      onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}
      accessibilityLabel={label}>
      {width > 0 ? (
        <Svg
          style={StyleSheet.absoluteFill}
          width={width}
          height={h + f}
          viewBox={`0 0 ${width} ${h + f}`}>
          {/* Folded tail tucked behind the card edge. */}
          <Polygon points={`${width - f},${h} ${width},${h} ${width - f},${h + f}`} fill={darken(color)} />
          {/* Ribbon body with a notched left end. */}
          <Polygon
            points={`0,0 ${width},0 ${width},${h} 0,${h} ${RIBBON_NOTCH},${h / 2}`}
            fill={color}
          />
        </Svg>
      ) : null}
      <Text className="text-[10px] font-semibold leading-none text-white" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
