import { colors } from '@/lib/design-tokens';
import { useColorScheme } from 'nativewind';
import { useId } from 'react';
import Svg, { Defs, LinearGradient, Polygon, Stop, Text as SvgText } from 'react-native-svg';

type DiscountTagSvgProps = {
  percentOff: number;
  /** Label font size in px (tag height and padding scale with it). */
  fontSize?: number;
};

/** Rough Poppins SemiBold advance per glyph (em) — SVG text can't be measured before layout. */
const GLYPH_EM = 0.62;

function tagLabel(percentOff: number) {
  return `${percentOff}% OFF`;
}

function tagMetrics(percentOff: number, fontSize: number) {
  const slant = fontSize * 0.55;
  const padLeft = fontSize * 0.45;
  const padRight = fontSize * 0.45 + slant;
  const height = Math.round(fontSize * 1.8);
  const width = Math.ceil(tagLabel(percentOff).length * fontSize * GLYPH_EM + padLeft + padRight);
  return { slant, padLeft, height, width };
}

/** Rendered width of the tag, for callers fitting it on one line. */
export function discountTagWidth(percentOff: number, fontSize = 10.5) {
  return tagMetrics(percentOff, fontSize).width;
}

/**
 * Green "13% OFF" tag drawn fully in SVG: gradient fill fading right, slanted right edge.
 */
export function DiscountTagSvg({ percentOff, fontSize = 10.5 }: DiscountTagSvgProps) {
  const { colorScheme } = useColorScheme();
  const green = colors[colorScheme === 'dark' ? 'dark' : 'light'].success;
  const gradientId = `discountTag${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const { slant, padLeft, height, width } = tagMetrics(percentOff, fontSize);

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      accessibilityLabel={`${percentOff} percent off`}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={green} stopOpacity={0.24} />
          <Stop offset="1" stopColor={green} stopOpacity={0.05} />
        </LinearGradient>
      </Defs>
      <Polygon
        points={`0,0 ${width},0 ${width - slant},${height} 0,${height}`}
        fill={`url(#${gradientId})`}
      />
      <SvgText
        x={padLeft}
        y={height / 2 + fontSize * 0.36}
        fill={green}
        fontSize={fontSize}
        fontFamily="Poppins_600SemiBold">
        {tagLabel(percentOff)}
      </SvgText>
    </Svg>
  );
}
