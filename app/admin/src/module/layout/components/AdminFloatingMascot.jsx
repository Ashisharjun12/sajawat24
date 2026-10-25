import { useNavigate } from "react-router-dom"
import { Mascot } from "page-mascot"
import wizardDirections from "@/assets/mascort/wizard-directions.webp"
import wizardReactions from "@/assets/mascort/wizard-reactions.webp"
import { useAiPolicy } from "@/providers/ai-policy-provider"
import { isAdminAiMascotVisible } from "@/module/layout/lib/admin-ai-mascot"

/** Compact mascot beside the header theme toggle (top right). */
const HEADER_MASCOT_SIZE = 68

export function AdminFloatingMascot() {
  const { policy, loading } = useAiPolicy()
  const navigate = useNavigate()

  if (loading || !isAdminAiMascotVisible(policy)) {
    return null
  }

  return (
    <div
      className="flex shrink-0 translate-y-1 cursor-pointer items-center justify-center sm:translate-y-1.5"
      onClick={() => navigate("/agent")}
      title="Open agent chat"
    >
      <Mascot
        directions={wizardDirections}
        reactions={wizardReactions}
        size={HEADER_MASCOT_SIZE}
        label="Open agent chat"
      />
    </div>
  )
}
