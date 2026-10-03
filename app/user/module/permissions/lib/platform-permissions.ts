import { Platform } from 'react-native';

export type PermissionKind = 'notifications' | 'location' | 'camera';

export type PermissionPlan = {
  kind: PermissionKind;
  /** When we ask in the product (not OS manifest). */
  promptWhen: string;
  iosUsageKey?: string;
  androidPermission?: string;
};

/** Product plan — manifests configured in app.json (vendor-aligned). */
export const PLATFORM_PERMISSION_PLAN: PermissionPlan[] = [
  {
    kind: 'notifications',
    promptWhen: 'Home feed after sign-in (card), before location step',
    iosUsageKey: 'NSUserNotificationsUsageDescription',
    androidPermission: 'POST_NOTIFICATIONS',
  },
  {
    kind: 'location',
    promptWhen: 'Home feed after sign-in, once notification step is done (card)',
    iosUsageKey: 'NSLocationWhenInUseUsageDescription',
    androidPermission: 'ACCESS_FINE_LOCATION',
  },
  {
    kind: 'camera',
    promptWhen: 'Profile or support photo upload (on demand)',
    iosUsageKey: 'NSCameraUsageDescription',
    androidPermission: 'CAMERA',
  },
];

export function isNativePlatform() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}
