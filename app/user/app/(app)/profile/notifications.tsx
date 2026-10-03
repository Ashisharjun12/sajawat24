import { Redirect, type Href } from 'expo-router';

/** Legacy path — inbox lives at `/(app)/notifications`. */
export default function ProfileNotificationsRedirect() {
  return <Redirect href={'/(app)/notifications?from=profile' as Href} />;
}
