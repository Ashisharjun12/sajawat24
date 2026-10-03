const STORAGE_KEY = "decory-account-demo-addresses";

const SEED = [
  {
    id: "demo-home",
    label: "Home",
    address: "42, Palm Grove Apartments, Koramangala 5th Block",
    landmark: "Near Sony World Signal",
    pincode: "560095",
    cityName: "Bengaluru",
    isDefault: true,
  },
];

function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function loadDemoAddresses() {
  const stored = readRaw();
  if (stored?.length) return stored;
  return SEED.map((row) => ({ ...row }));
}

export function saveDemoAddresses(addresses) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
}

export function createDemoAddress(input) {
  return {
    id: `addr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label: input.label.trim() || "Address",
    address: input.address.trim(),
    landmark: input.landmark?.trim() || "",
    pincode: input.pincode.replace(/\D/g, "").slice(0, 6),
    cityName: input.cityName.trim(),
    isDefault: Boolean(input.isDefault),
  };
}
