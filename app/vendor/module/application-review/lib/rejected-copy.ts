import { PENDING_REVIEW_IMAGE } from '@/module/application-review/lib/review-copy';

export const REJECTED_APPLICATION_IMAGE = PENDING_REVIEW_IMAGE;

export const REJECTED_APPLICATION_STEPS = [
  {
    id: 'submitted',
    label: 'Application submitted',
    detail: 'Your vendor profile and shop details were received.',
  },
  {
    id: 'rejected',
    label: 'Not approved',
    detail: 'Our team could not approve this application with the current details.',
  },
  {
    id: 'reapply',
    label: 'Reapply with updates',
    detail: 'Review your shop details and submit again for approval.',
  },
] as const;
