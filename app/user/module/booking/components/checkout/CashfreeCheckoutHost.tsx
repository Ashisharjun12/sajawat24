import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { isCashfreePgNativeLinked } from '@/module/booking/lib/cashfree-native-availability';
import {
  cashfreeCheckoutHtml,
  registerCashfreeCheckoutOpener,
} from '@/module/booking/lib/online-checkout-native';
import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ActiveSession = {
  paymentSessionId: string;
  environment: string;
  resolve: () => void;
  reject: (err: Error) => void;
};

/** WebView JS checkout: iOS always; Android until native SDK is linked (dev build). */
export function CashfreeCheckoutHost() {
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState<ActiveSession | null>(null);
  const useWebCheckout =
    Platform.OS === 'ios' || (Platform.OS === 'android' && !isCashfreePgNativeLinked());

  useEffect(() => {
    if (!useWebCheckout) {
      return () => registerCashfreeCheckoutOpener(null);
    }
    registerCashfreeCheckoutOpener(({ paymentSessionId, environment }) => {
      return new Promise<void>((resolve, reject) => {
        setSession({
          paymentSessionId,
          environment,
          resolve: () => {
            setSession(null);
            resolve();
          },
          reject: (err) => {
            setSession(null);
            reject(err);
          },
        });
      });
    });
    return () => registerCashfreeCheckoutOpener(null);
  }, [useWebCheckout]);

  if (!useWebCheckout) {
    return null;
  }

  function dismissCancelled() {
    session?.reject(new Error('Payment cancelled'));
  }

  return (
    <Modal visible={Boolean(session)} animationType="slide" onRequestClose={dismissCancelled}>
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-end px-3 py-2">
          <ScalePressable haptic onPress={dismissCancelled} className="p-2">
            <Icon as={X} className="size-6" />
          </ScalePressable>
        </View>
        {session ? (
          <WebView
            className="flex-1"
            originWhitelist={['*']}
            source={{ html: cashfreeCheckoutHtml(session.paymentSessionId, session.environment) }}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data) as {
                  type?: string;
                  message?: string;
                };
                if (data.type === 'success') {
                  session.resolve();
                  return;
                }
                if (data.type === 'error') {
                  session.reject(new Error(data.message || 'Payment failed'));
                }
              } catch {
                session.reject(new Error('Payment failed'));
              }
            }}
          />
        ) : (
          <Pressable className="flex-1" />
        )}
      </View>
    </Modal>
  );
}
