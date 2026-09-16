export type PaymentEnvironment = "live" | "sandbox";

/**
 * Selects one billing universe for the whole Edge Function deployment.
 * The safe default is live: a production deployment can never accidentally
 * grant access from a sandbox row just because the variable was omitted.
 */
export function getPaymentEnvironment(
  env: (name: string) => string | undefined = (name) => {
    const runtime = globalThis as unknown as {
      Deno?: { env: { get(key: string): string | undefined } };
    };
    return runtime.Deno?.env.get(name);
  },
): PaymentEnvironment {
  const value = env("PAYMENTS_ENVIRONMENT") ?? env("MP_ENVIRONMENT") ?? "live";
  if (value !== "live" && value !== "sandbox") {
    throw new Error("PAYMENTS_ENVIRONMENT_INVALID");
  }
  return value;
}
