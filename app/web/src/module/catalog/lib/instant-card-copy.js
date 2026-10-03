export function formatInstantCardEta(minutes) {
  const n = Number(minutes);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n >= 60 && n % 60 === 0) {
    const hours = n / 60;
    return hours === 1 ? "1 hr" : `${hours} hr`;
  }
  if (n >= 60) {
    const hours = Math.floor(n / 60);
    const mins = n % 60;
    return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
  }
  return `${n} min`;
}
