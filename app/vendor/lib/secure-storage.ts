import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'decoryy_vendor_access_token';
const REFRESH_TOKEN_KEY = 'decoryy_vendor_refresh_token';
const HAS_SEEN_WELCOME_KEY = 'decoryy_vendor_has_seen_welcome';
const NOTIFICATION_PROMPT_KEY = 'decoryy_vendor_notification_prompt_completed';
const LOCATION_PROMPT_KEY = 'decoryy_vendor_location_prompt_completed';
const PERMISSIONS_SETUP_KEY = 'decoryy_vendor_permissions_setup_completed';
const APP_THEME_KEY = 'decoryy_vendor_app_theme';
const ACTIVE_EN_ROUTE_ORDER_KEY = 'decoryy_vendor_active_en_route_order_id';

export async function loadAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function loadRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function saveTokens(accessToken: string, refreshToken?: string) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export async function loadHasSeenWelcome() {
  const value = await SecureStore.getItemAsync(HAS_SEEN_WELCOME_KEY);
  return value === '1';
}

export async function saveHasSeenWelcome() {
  await SecureStore.setItemAsync(HAS_SEEN_WELCOME_KEY, '1');
}

export async function clearHasSeenWelcome() {
  await SecureStore.deleteItemAsync(HAS_SEEN_WELCOME_KEY);
}

export async function loadNotificationPromptCompleted() {
  const value = await SecureStore.getItemAsync(NOTIFICATION_PROMPT_KEY);
  return value === '1';
}

export async function saveNotificationPromptCompleted() {
  await SecureStore.setItemAsync(NOTIFICATION_PROMPT_KEY, '1');
}

export async function loadLocationPromptCompleted() {
  const value = await SecureStore.getItemAsync(LOCATION_PROMPT_KEY);
  return value === '1';
}

export async function saveLocationPromptCompleted() {
  await SecureStore.setItemAsync(LOCATION_PROMPT_KEY, '1');
}

export async function clearLocationPromptCompleted() {
  await SecureStore.deleteItemAsync(LOCATION_PROMPT_KEY);
}

export async function loadPermissionsSetupCompleted() {
  const value = await SecureStore.getItemAsync(PERMISSIONS_SETUP_KEY);
  return value === '1';
}

export async function savePermissionsSetupCompleted() {
  await SecureStore.setItemAsync(PERMISSIONS_SETUP_KEY, '1');
  await SecureStore.setItemAsync(NOTIFICATION_PROMPT_KEY, '1');
  await SecureStore.setItemAsync(LOCATION_PROMPT_KEY, '1');
}

export async function clearPermissionsSetupCompleted() {
  await SecureStore.deleteItemAsync(PERMISSIONS_SETUP_KEY);
  await SecureStore.deleteItemAsync(NOTIFICATION_PROMPT_KEY);
  await SecureStore.deleteItemAsync(LOCATION_PROMPT_KEY);
}

export async function clearNotificationPromptCompleted() {
  await SecureStore.deleteItemAsync(NOTIFICATION_PROMPT_KEY);
}

export async function loadAppTheme() {
  return SecureStore.getItemAsync(APP_THEME_KEY);
}

export async function saveAppTheme(theme: 'light' | 'dark') {
  await SecureStore.setItemAsync(APP_THEME_KEY, theme);
}

export async function loadActiveEnRouteOrderId(): Promise<string | null> {
  const value = await SecureStore.getItemAsync(ACTIVE_EN_ROUTE_ORDER_KEY);
  return value?.trim() ? value.trim() : null;
}

export async function saveActiveEnRouteOrderId(orderId: string) {
  await SecureStore.setItemAsync(ACTIVE_EN_ROUTE_ORDER_KEY, orderId);
}

export async function clearActiveEnRouteOrderId() {
  await SecureStore.deleteItemAsync(ACTIVE_EN_ROUTE_ORDER_KEY);
}
