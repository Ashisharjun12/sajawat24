import { Screen } from '@/components/shell';
import { ExploreScreen } from '@/module/catalog/components/ExploreScreen';

export default function ExploreTabScreen() {
  return (
    <Screen scroll={false} edges={['top', 'left', 'right']} contentClassName="flex-1">
      <ExploreScreen />
    </Screen>
  );
}
