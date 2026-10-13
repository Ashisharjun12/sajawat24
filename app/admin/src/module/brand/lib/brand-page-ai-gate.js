export function getBrandPageAiBlockReason(policy) {
  if (!policy) {
    return "Could not load AI settings. Refresh the page or check your connection."
  }
  if (!policy.enabled) {
    return "Turn on Enable AI in Settings → AI."
  }
  if (!policy.admin) {
    return "Turn on Admin panel in Settings → AI."
  }
  if (!policy.llmConfigured) {
    return "LLM is not configured on the backend. Set LLM_* env vars and restart the API."
  }
  return null
}

export function getBrandPageAiGenerateBlockReason(policy, { brief, title }) {
  const policyReason = getBrandPageAiBlockReason(policy)
  if (policyReason) return policyReason

  const briefOk = (brief ?? "").trim().length >= 2
  const titleOk = (title ?? "").trim().length >= 3
  if (!briefOk && !titleOk) {
    return "Enter a brief (2+ characters) or a page title for AI."
  }
  return null
}
