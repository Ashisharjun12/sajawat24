const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isBackendCityId(id: string | null | undefined): boolean {
  return typeof id === 'string' && UUID_RE.test(id);
}

export function formatLocationLabel(
  city: { name?: string } | null,
  pincode: { code?: string } | null,
): string {
  if (!city?.name) return 'Select city';
  if (pincode?.code) return `${city.name} · ${pincode.code}`;
  return city.name;
}
