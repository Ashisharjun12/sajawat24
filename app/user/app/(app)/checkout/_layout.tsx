import { Stack } from 'expo-router';

export default function CheckoutStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="offers" options={{ animation: 'fade' }} />
      <Stack.Screen name="payment" />
      <Stack.Screen
        name="success/[orderId]"
        options={{
          gestureEnabled: false,
          animation: 'fade',
        }}
      />
    </Stack>
  );
}
