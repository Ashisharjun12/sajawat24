export type RejectedStepState = 'done' | 'active' | 'upcoming';

export function getRejectedStepState(index: number): RejectedStepState {
  if (index === 0) return 'done';
  if (index === 1) return 'active';
  return 'upcoming';
}
