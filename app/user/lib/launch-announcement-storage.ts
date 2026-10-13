import * as SecureStore from 'expo-secure-store';

const DISMISSED_KEY = 'sajawat_launch_announcement_dismissed_v1';

export async function loadDismissedLaunchAnnouncementIds(): Promise<string[]> {
  const raw = await SecureStore.getItemAsync(DISMISSED_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export async function dismissLaunchAnnouncement(id: string): Promise<void> {
  const existing = await loadDismissedLaunchAnnouncementIds();
  if (existing.includes(id)) return;
  const next = [...existing, id].slice(-50);
  await SecureStore.setItemAsync(DISMISSED_KEY, JSON.stringify(next));
}
