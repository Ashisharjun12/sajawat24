import { ScalePressable } from '@/components/shell';
import { Text } from '@/components/ui/text';
import {
  CATALOG_SORT_DEFAULT,
  CATALOG_SORT_OPTIONS,
  type CatalogSortId,
} from '@/module/catalog/lib/catalog-listing-sort';
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  IndianRupee,
  Sparkles,
  TrendingUp,
} from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { ScrollView, View } from 'react-native';

const SORT_ICONS: Partial<Record<CatalogSortId, typeof TrendingUp>> = {
  popularity: TrendingUp,
  new: Sparkles,
  price_asc: ArrowUpWideNarrow,
  price_desc: ArrowDownWideNarrow,
};

type CatalogListingToolbarProps = {
  total: number;
  sort: CatalogSortId;
  loading?: boolean;
  onSortChange: (sort: CatalogSortId) => void;
  onPricePress: () => void;
  priceOpen?: boolean;
  priceActive?: boolean;
  showPriceButton?: boolean;
};

export function CatalogListingToolbar({
  total,
  sort,
  loading = false,
  onSortChange,
  onPricePress,
  priceOpen = false,
  priceActive = false,
  showPriceButton = true,
}: CatalogListingToolbarProps) {
  return (
    <View className="gap-3 border-b border-border/80 pb-4" accessibilityLabel="Sort and filter products">
      <Text className="text-muted-foreground text-sm">
        <Text className="text-foreground font-bold tabular-nums">
          {loading ? '…' : total.toLocaleString()}
        </Text>{' '}
        products
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 pr-2">
        {CATALOG_SORT_OPTIONS.map((option) => {
          const active = sort === option.id;
          const SortIcon = SORT_ICONS[option.id];
          return (
            <ScalePressable
              key={option.id}
              onPress={() => onSortChange(option.id)}
              disabled={loading}
              haptic
              className={`flex-row items-center gap-1.5 rounded-full px-3 py-2 ${
                active ? 'bg-primary' : 'bg-muted'
              }`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}>
              {SortIcon ? (
                <Icon
                  as={SortIcon}
                  className={`size-3.5 ${active ? 'text-primary-foreground' : 'text-foreground'}`}
                />
              ) : null}
              <Text
                className={`text-xs font-semibold ${
                  active ? 'text-primary-foreground' : 'text-foreground'
                }`}>
                {option.label}
              </Text>
            </ScalePressable>
          );
        })}
        {showPriceButton ? (
          <ScalePressable
            onPress={onPricePress}
            disabled={loading}
            haptic
            className={`flex-row items-center gap-1.5 rounded-full px-3 py-2 ${
              priceOpen || priceActive ? 'bg-primary' : 'bg-muted'
            }`}
            accessibilityRole="button"
            accessibilityState={{ expanded: priceOpen }}>
            <Icon
              as={IndianRupee}
              className={`size-3.5 ${
                priceOpen || priceActive ? 'text-primary-foreground' : 'text-foreground'
              }`}
            />
            <Text
              className={`text-xs font-semibold ${
                priceOpen || priceActive ? 'text-primary-foreground' : 'text-foreground'
              }`}>
              Custom price
            </Text>
          </ScalePressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

export { CATALOG_SORT_DEFAULT };
