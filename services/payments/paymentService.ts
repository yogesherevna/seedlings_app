export const CUSTOMER_PAYMENT_METHODS = ['UPI', 'Card', 'Wallet'] as const;
export type CustomerPaymentMethod = (typeof CUSTOMER_PAYMENT_METHODS)[number];

export type PaymentStatus = 'pending' | 'partially_paid' | 'paid' | 'failed' | 'refunded' | string;

export type PaymentTransaction = {
  id?: string;
  amount?: number;
  method?: string;
  status?: string;
  receiptUrl?: string;
  receiptPath?: string;
  transactionId?: string;
  createdAt?: unknown;
};

export function prettyPaymentStatus(status?: string) {
  return String(status || 'pending')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

export function paymentStatusMessage(status?: string) {
  switch (status) {
    case 'paid': return 'Payment received';
    case 'partially_paid': return 'Partially paid';
    case 'failed': return 'Payment failed';
    case 'refunded': return 'Payment refunded';
    default: return 'Payment pending';
  }
}

/**
 * Phase 12 deliberately does not write payment results from the mobile client.
 * A real gateway/webhook or trusted backend must authorize the final payment state.
 */
export function isPaymentGatewayConfigured() {
  return false;
}
