export function getAnnouncementAiBlockReason(policy) {
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

export function getAnnouncementAiGenerateBlockReason(policy, { topic, message }) {
  const policyReason = getAnnouncementAiBlockReason(policy)
  if (policyReason) return policyReason

  const topicOk = (topic ?? "").trim().length >= 2
  const messageOk = (message ?? "").trim().length >= 5
  if (!topicOk && !messageOk) {
    return "Enter a topic (2+ chars) or a draft message (5+ chars) for AI."
  }
  return null
}
