export function isFaqAiReady(policy) {
  return Boolean(policy?.enabled && policy?.admin && policy?.llmConfigured)
}

export function getFaqAiBlockReason(policy) {
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

export function getFaqAiGenerateBlockReason(policy, { topic, question }) {
  const policyReason = getFaqAiBlockReason(policy)
  if (policyReason) return policyReason

  const topicOk = (topic ?? "").trim().length >= 2
  const questionOk = (question ?? "").trim().length >= 5
  if (!topicOk && !questionOk) {
    return "Enter a topic (2+ characters) or a question (5+ characters) for AI."
  }
  return null
}
