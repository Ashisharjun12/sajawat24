import { getApiError } from '@/api/client';
import { getOrder } from '@/api/orders.api';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useSubmitOrderReview } from '@/module/account/hooks/use-submit-order-review';
import { OrderReviewStarPicker } from '@/module/account/components/order-review/OrderReviewStarPicker';
import { HomeBottomSheetModal } from '@/module/home/components/HomeBottomSheetModal';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Alert, TextInput, View } from 'react-native';

const MIN_BODY = 10;
const MAX_BODY = 2000;

type Props = {
  visible: boolean;
  onClose: () => void;
  orderId: string;
  /** When known (order detail), skips fetch for product label. */
  productName?: string;
  productId?: string;
};

export function OrderReviewSheet({
  visible,
  onClose,
  orderId,
  productName: productNameProp,
  productId: productIdProp,
}: Props) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');

  const { data: order } = useQuery({
    queryKey: ['orders', 'detail', orderId, 'review-prefetch'],
    queryFn: () => getOrder(orderId),
    enabled: visible && Boolean(orderId),
    staleTime: 60_000,
  });

  const productId = useMemo(() => {
    if (productIdProp) return productIdProp;
    const items = order?.items ?? [];
    if (items.length === 1) return items[0].productId;
    return undefined;
  }, [productIdProp, order?.items]);

  const productName =
    productNameProp ?? order?.items?.[0]?.name ?? order?.items?.find((i) => i.productId === productId)?.name;

  const submit = useSubmitOrderReview(orderId);

  useEffect(() => {
    if (!visible) {
      setRating(0);
      setBody('');
    }
  }, [visible]);

  const trimmed = body.trim();
  const canSubmit =
    rating >= 1 && trimmed.length >= MIN_BODY && !submit.isPending && Boolean(productId);

  async function handleSubmit() {
    if (!productId) {
      Alert.alert(
        'Choose a setup',
        'This booking has multiple items. Open the order from your list and try again, or contact support.',
      );
      return;
    }
    try {
      await submit.mutateAsync({
        rating,
        body: trimmed,
        productId,
      });
      Alert.alert('Thank you!', 'Your review helps other customers choose with confidence.');
      onClose();
    } catch (err) {
      Alert.alert('Could not submit review', getApiError(err));
    }
  }

  return (
    <HomeBottomSheetModal
      visible={visible}
      onClose={onClose}
      closeAccessibilityLabel="Close review"
      sheetMinHeight={420}>
      <View className="w-full max-w-lg px-5 pb-2">
        <Text className="text-foreground text-xl font-bold">Leave a review</Text>
        {productName ? (
          <Text className="text-muted-foreground mt-1 text-sm" numberOfLines={2}>
            {productName}
          </Text>
        ) : null}

        <View className="mt-6">
          <OrderReviewStarPicker value={rating} onChange={setRating} disabled={submit.isPending} />
        </View>

        <Text className="text-foreground mt-6 text-sm font-semibold">Tell us about your experience</Text>
        <TextInput
          className="mt-2 min-h-[120px] rounded-2xl border border-border bg-muted/30 px-4 py-3 text-base text-foreground"
          placeholder="What went well? Would you book again?"
          placeholderTextColor="#9CA3AF"
          multiline
          textAlignVertical="top"
          maxLength={MAX_BODY}
          value={body}
          onChangeText={setBody}
          editable={!submit.isPending}
        />
        <Text className="text-muted-foreground mt-1.5 text-xs">
          {trimmed.length < MIN_BODY
            ? `At least ${MIN_BODY} characters (${trimmed.length}/${MIN_BODY})`
            : `${trimmed.length} / ${MAX_BODY}`}
        </Text>

        <Button
          className="mt-5 h-12 w-full rounded-full"
          disabled={!canSubmit}
          onPress={() => void handleSubmit()}>
          <Text className="text-primary-foreground font-semibold">
            {submit.isPending ? 'Submitting…' : 'Submit review'}
          </Text>
        </Button>
      </View>
    </HomeBottomSheetModal>
  );
}
