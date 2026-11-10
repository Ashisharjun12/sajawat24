import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { PRIMARY_CTA_BUTTON_CLASS } from '@/lib/primary-cta-button';
import { useCartMutations } from '@/module/booking/hooks/use-cart-query';
import { HomeBottomSheetModal } from '@/module/home/components/HomeBottomSheetModal';
import { friendlyCouponError } from '@/module/promotions/lib/coupon-error-message';
import { X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, View } from 'react-native';

const CODE_MIN = 3;
const CODE_MAX = 24;

type CheckoutCouponCodeSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Called after the server accepted the code (the cart already holds the discount). */
  onApplied: (code: string) => void;
  /** No delivery city yet: the API cannot price a coupon, so applying is blocked. */
  needsCity: boolean;
  /** Code currently on the cart, if any. */
  appliedCode?: string | null;
};

/** "Have a code?" — type a coupon code (hidden coupons included) and apply it to the cart. */
export function CheckoutCouponCodeSheet({
  visible,
  onClose,
  onApplied,
  needsCity,
  appliedCode,
}: CheckoutCouponCodeSheetProps) {
  const { applyCoupon } = useCartMutations();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /** Guards double taps (state updates are async, a second tap could slip in before re-render). */
  const submittingRef = useRef(false);

  useEffect(() => {
    if (visible) {
      setCode('');
      setError(null);
    }
  }, [visible]);

  const valid = code.length >= CODE_MIN && code.length <= CODE_MAX;
  const canSubmit = valid && !needsCity && !submitting;

  function onChangeCode(text: string) {
    // Codes are case-insensitive and never contain spaces (pasted codes often carry one).
    setCode(text.replace(/\s+/g, '').toUpperCase().slice(0, CODE_MAX));
    if (error) setError(null);
  }

  function close() {
    // Closing mid-request would hide the result the user is waiting for.
    if (submittingRef.current) return;
    Keyboard.dismiss();
    onClose();
  }

  async function submit() {
    if (submittingRef.current) return;
    if (needsCity) {
      setError('Select a delivery address to apply coupons.');
      return;
    }
    if (!valid) {
      setError(`Enter a coupon code (${CODE_MIN}–${CODE_MAX} characters).`);
      return;
    }
    if (appliedCode && appliedCode.toUpperCase() === code) {
      // Already on the cart: nothing to call, just go back to checkout.
      Keyboard.dismiss();
      onApplied(code);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      await applyCoupon.mutateAsync(code);
      Keyboard.dismiss();
      onApplied(code);
    } catch (e) {
      // Stay open with the code in place so a typo can be fixed.
      setError(friendlyCouponError(e));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <HomeBottomSheetModal visible={visible} onClose={close} closeAccessibilityLabel="Close coupon code">
      <View className="gap-4 px-5 pb-4 pt-3">
        <Text className="text-foreground text-h2 font-semibold">Have a coupon code? Apply here!</Text>

        <View className="gap-1.5">
          <Text className="text-foreground text-sm font-medium">Coupon code</Text>
          <View className="relative">
            <Input
              value={code}
              onChangeText={onChangeCode}
              placeholder="Enter coupon code"
              autoFocus
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="off"
              returnKeyType="done"
              maxLength={CODE_MAX}
              editable={!submitting}
              onSubmitEditing={() => void submit()}
              className={error ? 'border-destructive h-12 rounded-xl pr-11' : 'h-12 rounded-xl pr-11'}
              accessibilityLabel="Coupon code"
            />
            {code.length > 0 && !submitting ? (
              <Pressable
                onPress={() => onChangeCode('')}
                hitSlop={10}
                className="absolute bottom-0 right-3 top-0 justify-center"
                accessibilityRole="button"
                accessibilityLabel="Clear coupon code">
                <View className="size-5 items-center justify-center rounded-full bg-muted-foreground/70">
                  <Icon as={X} className="size-3 text-background" />
                </View>
              </Pressable>
            ) : null}
          </View>
          {error ? (
            <Text
              className="text-destructive text-sm"
              accessibilityLiveRegion="polite"
              accessibilityRole="alert">
              {error}
            </Text>
          ) : needsCity ? (
            <Text className="text-muted-foreground text-sm">
              Select a delivery address to apply coupons.
            </Text>
          ) : null}
        </View>

        <Button
          variant="primary"
          className={PRIMARY_CTA_BUTTON_CLASS}
          disabled={!canSubmit}
          loading={submitting}
          onPress={() => void submit()}
          accessibilityLabel="Apply coupon">
          <Text>Apply</Text>
        </Button>
      </View>
    </HomeBottomSheetModal>
  );
}
