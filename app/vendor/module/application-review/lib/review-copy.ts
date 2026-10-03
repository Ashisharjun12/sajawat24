export const PENDING_REVIEW_IMAGE =
  'https://ik.imagekit.io/aevhlnk0h/undraw_action-required_pplo.png';

export const PENDING_REVIEW_STEPS = [
  {
    id: 'submitted',
    label: 'Application submitted',
    detail: 'Your vendor profile and shop details were received.',
  },
  {
    id: 'review',
    label: 'Under review',
    detail: 'Our team is verifying your information.',
  },
  {
    id: 'approved',
    label: 'Start receiving bookings',
    detail: 'You will get access to assigned jobs in your city.',
  },
] as const;
