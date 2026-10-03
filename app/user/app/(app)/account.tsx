import { Redirect } from 'expo-router';

/** Legacy hidden route → profile account stack screen. */
export default function AccountRedirect() {
  return <Redirect href="/(app)/profile/account" />;
}
