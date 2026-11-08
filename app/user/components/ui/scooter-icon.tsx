import Svg, { Circle, Path, Rect } from 'react-native-svg';

/** Height / width of the scooter artwork (viewBox 24 × 16). */
export const SCOOTER_ASPECT = 16 / 24;

type ScooterIconProps = {
  /** Icon width in px; height follows `SCOOTER_ASPECT`. */
  width?: number;
  color?: string;
};

/**
 * Simple delivery scooter with some weight: solid parcel box and body, thick handlebar
 * and fork, chunky wheels with open hubs. One color, no rider.
 */
export function ScooterIcon({ width = 22, color = '#15803D' }: ScooterIconProps) {
  const height = width * SCOOTER_ASPECT;
  const bar = {
    stroke: color,
    strokeWidth: 2.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg width={width} height={height} viewBox="0 0 24 16" accessibilityElementsHidden>
      {/* Solid parcel box */}
      <Rect x="1.5" y="3" width="6.5" height="5.5" rx="0.8" fill={color} />
      {/* Solid body: rear hump over the back wheel, footboard, rising to the front */}
      <Path
        d="M1.5 11.4 Q1.6 8.6 4.6 8.6 H8.6 L10 10.4 H14.6 L17.2 4.6 H18.8 L16.4 12 Q16 12.9 15 12.9 H8.6 Q8.2 10.6 5.5 10.6 Q3 10.6 2.6 12.2 Z"
        fill={color}
      />
      {/* Handlebar + fork */}
      <Path d="M16.4 4.2 H19.8" {...bar} />
      <Path d="M18.2 5 L20.1 11.6" {...bar} />
      {/* Chunky wheels with open hubs */}
      <Circle cx="5.5" cy="12.8" r="2.2" fill="none" stroke={color} strokeWidth="2" />
      <Circle cx="20.1" cy="12.8" r="2.2" fill="none" stroke={color} strokeWidth="2" />
    </Svg>
  );
}
