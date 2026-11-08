import Svg, { Defs, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

type DiscountSealProps = {
  /** Diameter in px. */
  size?: number;
  /** Lighter (top-left) and deeper (bottom-right) mint of the gradient fill. */
  fromColor?: string;
  toColor?: string;
};

/** Soft scalloped seal (9 rounded bumps) centred in a 40 × 40 box. */
function sealPath() {
  const cx = 20;
  const cy = 20;
  const bumps = 9;
  const outer = 19.5;
  const inner = 16.8;
  const pts: string[] = [];
  for (let i = 0; i < bumps * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / bumps - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  // Curve through each valley using the bump tip as the control point → soft, rounded edge.
  let d = `M ${pts[pts.length - 1]}`;
  for (let i = 0; i < pts.length; i += 2) {
    d += ` Q ${pts[i]} ${pts[i + 1]}`;
  }
  return `${d} Z`;
}

const SEAL_D = sealPath();

/** Pale mint scalloped "%" seal for offer cards (like the "Offers Available" art), SVG. */
export function DiscountSeal({
  size = 40,
  fromColor = '#D6F5DF',
  toColor = '#A9E4BC',
}: DiscountSealProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessibilityElementsHidden>
      <Defs>
        <LinearGradient id="discountSealFill" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={fromColor} />
          <Stop offset="1" stopColor={toColor} />
        </LinearGradient>
      </Defs>
      <Path d={SEAL_D} fill="url(#discountSealFill)" />
      <SvgText
        x="20"
        y="27.5"
        fill="#FFFFFF"
        fontSize="21"
        fontFamily="Poppins_600SemiBold"
        textAnchor="middle">
        %
      </SvgText>
    </Svg>
  );
}
