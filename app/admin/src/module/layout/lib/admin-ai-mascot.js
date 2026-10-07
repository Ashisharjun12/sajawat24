export function isAdminAiMascotVisible(policy) {
  return Boolean(policy?.enabled && policy?.admin)
}
