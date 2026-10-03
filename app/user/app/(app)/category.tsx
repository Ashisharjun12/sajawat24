import { Screen } from '@/components/shell';
import { CategoryBrowseScreen } from '@/module/catalog/components/CategoryBrowseScreen';

export default function CategoryTabScreen() {
  return (
    <Screen scroll={false} edges={['top', 'left', 'right']} contentClassName="flex-1">
      <CategoryBrowseScreen />
    </Screen>
  );
}
