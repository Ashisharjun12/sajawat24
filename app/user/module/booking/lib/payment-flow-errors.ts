export class OnlinePaymentIncompleteError extends Error {
  readonly orderId: string;
  readonly userCancelled: boolean;

  constructor(orderId: string, message: string, userCancelled = false) {
    super(message);
    this.name = 'OnlinePaymentIncompleteError';
    this.orderId = orderId;
    this.userCancelled = userCancelled;
  }
}

export function isPaymentCancelledMessage(message: string): boolean {
  const lower = message.toLowerCase().trim();
  if (lower.includes('failed')) return false;
  return (
    lower === 'payment cancelled' ||
    lower.includes('user closed') ||
    lower.includes('user cancelled') ||
    lower.includes('dismissed') ||
    lower.includes('aborted')
  );
}
