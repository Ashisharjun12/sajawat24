import { useEffect, useState } from "react"
import { Mascot } from "page-mascot"
import wizardDirections from "@/assets/mascort/wizard-directions.webp"
import wizardReactions from "@/assets/mascort/wizard-reactions.webp"
import { useAiPolicy } from "@/providers/ai-policy-provider"
import { isAdminAiMascotVisible } from "@/module/layout/lib/admin-ai-mascot"

function useMascotSize() {
  const [size, setSize] = useState(88)

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    const update = () => setSize(mq.matches ? 104 : 88)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  return size
}

export function AdminFloatingMascot() {
  const { policy, loading } = useAiPolicy()
  const size = useMascotSize()

  if (loading || !isAdminAiMascotVisible(policy)) {
    return null
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
      <div className="pointer-events-auto drop-shadow-md">
        <Mascot
          directions={wizardDirections}
          reactions={wizardReactions}
          size={size}
          label="AI assistant"
        />
      </div>
    </div>
  )
}
