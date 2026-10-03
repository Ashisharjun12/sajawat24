import { Alert } from 'react-native';

export function showAuthHelp(devOtp?: string | null) {
  const otpLine = devOtp ? `Dev OTP: ${devOtp}\n\n` : '';
  Alert.alert(
    'Need help?',
    `${otpLine}New vendor: register and verify your phone.\nReturning vendor: sign in with your phone.\n\nSupport: hello@decoryy.com`,
    [{ text: 'OK' }]
  );
}
