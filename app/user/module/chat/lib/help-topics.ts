export type HelpTopic = {
  topicKey: string;
  title: string;
  description: string;
};

export const HELP_TOPICS: HelpTopic[] = [
  {
    topicKey: 'booking',
    title: 'Booking issue',
    description: 'Wrong date, reschedule, or cancellation questions.',
  },
  {
    topicKey: 'payment',
    title: 'Payment & refund',
    description: 'COD, online payment, or refund status.',
  },
  {
    topicKey: 'vendor',
    title: 'Decorator quality',
    description: 'Service quality, delays, or partner conduct.',
  },
  {
    topicKey: 'other',
    title: 'Something else',
    description: 'General help with your Decory account.',
  },
];

export function getHelpTopic(topicKey: string | undefined): HelpTopic | null {
  if (!topicKey) return null;
  return HELP_TOPICS.find((t) => t.topicKey === topicKey) ?? null;
}
