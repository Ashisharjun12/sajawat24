import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { getAiPolicy } from "@/api/settings.api"

const AiPolicyContext = createContext(null)

export function useAiPolicy() {
  const value = useContext(AiPolicyContext)
  if (!value) {
    throw new Error("useAiPolicy must be used within AiPolicyProvider")
  }
  return value
}

export function AiPolicyProvider({ children }) {
  const [policy, setPolicy] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshAiPolicy = useCallback(async () => {
    const data = await getAiPolicy()
    setPolicy(data)
    return data
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getAiPolicy()
      .then((data) => {
        if (!cancelled) setPolicy(data)
      })
      .catch(() => {
        if (!cancelled) setPolicy(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(
    () => ({ policy, loading, refreshAiPolicy }),
    [policy, loading, refreshAiPolicy],
  )

  return <AiPolicyContext.Provider value={value}>{children}</AiPolicyContext.Provider>
}
