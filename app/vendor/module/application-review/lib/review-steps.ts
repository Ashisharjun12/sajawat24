export type ReviewStepState = 'done' | 'active' | 'upcoming';

export function getReviewStepState(index: number): ReviewStepState {
  if (index === 0) return 'done';
  if (index === 1) return 'active';
  return 'upcoming';
}
