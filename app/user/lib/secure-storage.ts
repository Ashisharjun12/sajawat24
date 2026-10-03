import * as SecureStore from 'expo-secure-store';

import type { CustomerUser } from '@/lib/auth.types';

const ACCESS_TOKEN_KEY = 'deccorbuddys_user_access_token';
const REFRESH_TOKEN_KEY = 'deccorbuddys_user_refresh_token';
const USER_PHONE_KEY = 'deccorbuddys_user_phone';
const USER_PROFILE_KEY = 'deccorbuddys_user_profile';
const HAS_SEEN_WELCOME_KEY = 'deccorbuddys_user_has_seen_welcome';
const NOTIFICATION_PROMPT_KEY = 'deccorbuddys_user_notification_prompt_done';
const LOCATION_PROMPT_KEY = 'deccorbuddys_user_location_prompt_done';
const PERMISSIONS_SETUP_KEY = 'deccorbuddys_user_permissions_setup_done';
const APP_THEME_KEY = 'decoryy_user_app_theme';

export async function loadAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function saveAccessToken(accessToken: string) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
}

export async function loadRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function saveRefreshToken(refreshToken: string) {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function clearRefreshToken() {
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearAccessToken() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_PHONE_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_PROFILE_KEY),
  ]);
}

export async function saveUserProfile(user: CustomerUser) {
  await SecureStore.setItemAsync(USER_PROFILE_KEY, JSON.stringify(user));
}

export async function loadUserProfile(): Promise<CustomerUser | null> {
  const raw = await SecureStore.getItemAsync(USER_PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CustomerUser;
  } catch {
    return null;
  }
}

export async function loadUserPhone() {
  return SecureStore.getItemAsync(USER_PHONE_KEY);
}

export async function saveUserPhone(phone: string) {
  await SecureStore.setItemAsync(USER_PHONE_KEY, phone);
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

export async function loadPermissionsSetupCompleted() {
  const value = await SecureStore.getItemAsync(PERMISSIONS_SETUP_KEY);
  return value === '1';
}

export async function savePermissionsSetupCompleted() {
  await SecureStore.setItemAsync(PERMISSIONS_SETUP_KEY, '1');
  await SecureStore.setItemAsync(NOTIFICATION_PROMPT_KEY, '1');
  await SecureStore.setItemAsync(LOCATION_PROMPT_KEY, '1');
}

export async function loadAppTheme() {
  return SecureStore.getItemAsync(APP_THEME_KEY);
}

export async function saveAppTheme(theme: 'light' | 'dark') {
  await SecureStore.setItemAsync(APP_THEME_KEY, theme);
}
