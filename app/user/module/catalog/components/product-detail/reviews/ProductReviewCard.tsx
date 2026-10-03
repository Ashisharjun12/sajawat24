import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ProductStarRow } from '@/module/catalog/components/product-detail/reviews/ProductStarRow';
import { format } from 'date-fns';
import { Image } from 'expo-image';
import { BadgeCheck, MapPin } from 'lucide-react-native';
import { View } from 'react-native';

export type ProductReviewItem = {
  id: string;
  rating?: number;
  body?: string;
  reviewerName?: string;
  reviewerCity?: string;
  reviewedAt?: string;
  isVerified?: boolean;
  avatar?: { url?: string; thumbnailUrl?: string };
};

function initials(name: string | undefined) {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function formatReviewDate(value: string | undefined) {
  if (!value) return '';
  try {
    return format(new Date(value), 'MMM yyyy');
  } catch {
    return '';
  }
}

type ProductReviewCardProps = {
  review: ProductReviewItem;
};

export function ProductReviewCard({ review }: ProductReviewCardProps) {
  const avatarUrl = review.avatar?.url || review.avatar?.thumbnailUrl;
  const dateLabel = formatReviewDate(review.reviewedAt);
  const rating = Math.min(5, Math.max(0, Number(review.rating ?? 0)));

  return (
    <View className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row items-start gap-3">
          <View className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-100">
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={{ width: 40, height: 40 }} contentFit="cover" />
            ) : (
              <Text className="text-sm font-semibold text-violet-700">
                {initials(review.reviewerName)}
              </Text>
            )}
          </View>
          <View className="min-w-0 flex-1">
            <View className="flex-row flex-wrap items-center gap-1.5">
              <Text className="text-foreground font-medium">
                {review.reviewerName?.trim() || 'Customer'}
              </Text>
              {review.isVerified ? (
                <Icon as={BadgeCheck} className="size-4 text-sky-600" accessibilityLabel="Verified purchase" />
              ) : null}
            </View>
            {review.reviewerCity ? (
              <View className="mt-0.5 flex-row items-center gap-1">
                <Icon as={MapPin} className="text-muted-foreground size-3" />
                <Text className="text-muted-foreground text-xs">{review.reviewerCity}</Text>
              </View>
            ) : null}
          </View>
        </View>
        {dateLabel ? (
          <Text className="text-muted-foreground shrink-0 text-xs">{dateLabel}</Text>
        ) : null}
      </View>

      <ProductStarRow rating={rating} size="sm" className="mt-3" />
      {review.body?.trim() ? (
        <Text className="text-foreground/90 mt-2 text-sm leading-relaxed">{review.body.trim()}</Text>
      ) : null}
    </View>
  );
}
