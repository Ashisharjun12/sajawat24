import { Screen } from '@/components/shell';
import { InstantScreen } from '@/module/catalog/components/InstantScreen';

export default function InstantTabScreen() {
  return (
    <Screen scroll={false} edges={['top', 'left', 'right']} contentClassName="flex-1">
      <InstantScreen />
    </Screen>
  );
}
