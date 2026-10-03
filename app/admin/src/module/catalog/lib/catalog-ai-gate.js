export function isCatalogAiReady(policy) {
  return Boolean(policy?.enabled && policy?.admin && policy?.llmConfigured)
}

export function getCatalogAiPolicyBlockReason(policy) {
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
    return "LLM is not configured. Set LLM_API_KEY, LLM_BASE_URL, and LLM_MODEL in the backend, then restart the server."
  }
  return null
}

export function getCatalogAiFormBlockReason({ name, parentCategoryId, categoryName }) {
  const trimmedName = (name ?? "").trim()
  if (trimmedName.length < 2) {
    return "Enter a product name (at least 2 characters)."
  }
  if (!parentCategoryId) {
    return "Select a category."
  }
  if (!categoryName) {
    return "Select a category."
  }
  return null
}

export function getCatalogAiGenerateBlockReason(policy, formInput) {
  return getCatalogAiPolicyBlockReason(policy) ?? getCatalogAiFormBlockReason(formInput)
}

export function getCatalogAiRequirementChecks(policy, formInput) {
  const policyReason = getCatalogAiPolicyBlockReason(policy)
  if (policyReason) {
    return [{ label: policyReason, done: false, kind: "policy" }]
  }

  return [
    {
      label: "Name",
      done: (formInput.name ?? "").trim().length >= 2,
      kind: "field",
    },
    {
      label: "Category",
      done: Boolean(formInput.parentCategoryId && formInput.categoryName),
      kind: "field",
    },
  ]
}
