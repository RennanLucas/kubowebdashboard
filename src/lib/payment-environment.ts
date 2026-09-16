export type PaymentEnvironment = "live" | "sandbox";

/**
 * The public build may display only subscription rows from its own billing
 * universe. Preview/sandbox builds must explicitly set the Vite variable.
 */
export function getPaymentEnvironment(): PaymentEnvironment {
  return import.meta.env.VITE_PAYMENTS_ENVIRONMENT === "sandbox" ? "sandbox" : "live";
}
