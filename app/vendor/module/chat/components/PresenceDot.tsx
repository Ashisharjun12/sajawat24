import { View } from 'react-native';

type PresenceDotProps = {
  online?: boolean;
  size?: number;
};

export function PresenceDot({ online = false, size = 10 }: PresenceDotProps) {
  return (
    <View
      className={online ? 'bg-emerald-500' : 'bg-muted-foreground/40'}
      style={{ width: size, height: size, borderRadius: size / 2 }}
    />
  );
}
