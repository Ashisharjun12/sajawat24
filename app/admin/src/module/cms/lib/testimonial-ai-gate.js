export function getTestimonialAiBlockReason(policy) {
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

export function getTestimonialAiGenerateBlockReason(policy, { topic, quote }) {
  const policyReason = getTestimonialAiBlockReason(policy)
  if (policyReason) return policyReason

  const topicOk = (topic ?? "").trim().length >= 2
  const quoteOk = (quote ?? "").trim().length >= 10
  if (!topicOk && !quoteOk) {
    return "Enter a topic (2+ chars) or a draft quote (10+ chars) for AI."
  }
  return null
}
