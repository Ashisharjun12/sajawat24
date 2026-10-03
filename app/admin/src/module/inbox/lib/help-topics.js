export const HELP_TOPICS = [
  {
    topicKey: "booking",
    title: "Booking issue",
    badgeClass: "bg-blue-600 text-white hover:bg-blue-600",
  },
  {
    topicKey: "payment",
    title: "Payment & refund",
    badgeClass: "bg-emerald-600 text-white hover:bg-emerald-600",
  },
  {
    topicKey: "vendor",
    title: "Decorator quality",
    badgeClass: "bg-amber-500 text-white hover:bg-amber-500",
  },
  {
    topicKey: "other",
    title: "Something else",
    badgeClass: "bg-violet-600 text-white hover:bg-violet-600",
  },
  {
    topicKey: "general",
    title: "Help & support",
    badgeClass: "bg-slate-600 text-white hover:bg-slate-600",
  },
]

export function getHelpTopic(topicKey) {
  if (!topicKey) return null
  return HELP_TOPICS.find((topic) => topic.topicKey === topicKey) ?? null
}
