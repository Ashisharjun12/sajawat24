import { Redirect, type Href } from 'expo-router';

/** Legacy deep link — placeholder Settings screen removed. */
export default function ProfileSettingsRedirect() {
  return <Redirect href={'/(app)/profile' as Href} />;
}
