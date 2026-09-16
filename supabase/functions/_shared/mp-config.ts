import { getPaymentEnvironment } from "./payment-environment.ts";

export function getMpConfig(env:(name:string) => string|undefined) {
  const environment = getPaymentEnvironment(env);
  const token = environment==="sandbox"
    ? env("MP_SANDBOX_ACCESS_TOKEN") ?? env("PAYMENTS_SANDBOX_ACCESS_TOKEN")
    : env("MERCADO_PAGO_ACCESS_TOKEN") ?? env("MP_ACCESS_TOKEN") ?? env("PAYMENTS_LIVE_ACCESS_TOKEN");
  const secret = environment==="sandbox"
    ? env("MP_SANDBOX_WEBHOOK_SECRET") ?? env("PAYMENTS_SANDBOX_WEBHOOK_SECRET")
    : env("MP_WEBHOOK_SECRET") ?? env("PAYMENTS_LIVE_WEBHOOK_SECRET");
  return { environment,token,secret };
}
