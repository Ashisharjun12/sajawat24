import Svg, { Circle, Rect } from 'react-native-svg';

type IndiaFlagProps = {
  /** Flag width in px; height follows the 3:2 ratio. */
  width?: number;
};

/** Indian tricolour (saffron / white / green + navy chakra), drawn in SVG. */
export function IndiaFlag({ width = 24 }: IndiaFlagProps) {
  const height = (width * 2) / 3;
  return (
    <Svg width={width} height={height} viewBox="0 0 30 20" accessibilityLabel="India">
      <Rect x="0" y="0" width="30" height="6.67" fill="#FF9933" />
      <Rect x="0" y="6.67" width="30" height="6.66" fill="#FFFFFF" />
      <Rect x="0" y="13.33" width="30" height="6.67" fill="#138808" />
      <Circle cx="15" cy="10" r="2.6" fill="none" stroke="#000080" strokeWidth="0.7" />
      <Circle cx="15" cy="10" r="0.6" fill="#000080" />
      <Rect
        x="0.25"
        y="0.25"
        width="29.5"
        height="19.5"
        fill="none"
        stroke="#E2E8F0"
        strokeWidth="0.5"
      />
    </Svg>
  );
}
