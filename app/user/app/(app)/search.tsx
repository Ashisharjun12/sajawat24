import { Screen } from '@/components/shell';
import { SearchScreen } from '@/module/catalog/components/SearchScreen';

export default function SearchRoute() {
  return (
    <Screen scroll={false} edges={['top', 'left', 'right']} contentClassName="flex-1">
      <SearchScreen />
    </Screen>
  );
}
