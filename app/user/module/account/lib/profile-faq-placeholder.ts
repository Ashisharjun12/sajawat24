export type ProfileFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const PROFILE_FAQ_PLACEHOLDER: ProfileFaqItem[] = [
  {
    id: 'speed',
    question: 'How fast can a decoration be set up?',
    answer:
      'Most bookings made the evening before can be set up the next morning. Same-day slots show up in checkout when a crew is free in your city.',
  },
  {
    id: 'customise',
    question: 'Can I customise the colours or theme?',
    answer:
      'Yes. Each setup lists a palette, and you can note colour or prop changes before you confirm. The crew works from that brief.',
  },
  {
    id: 'reschedule',
    question: 'What if I need to reschedule?',
    answer:
      'You can move the date up to 24 hours before the slot at no extra charge. Closer than that, the team will tell you what is still possible.',
  },
];
