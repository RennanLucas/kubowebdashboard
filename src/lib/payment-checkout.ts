import { getPaymentEnvironment } from "@/lib/payment-environment";

export function checkoutUrlFromResponse(data: unknown): string {
  const result = data as { url?: unknown; environment?: unknown; error?: unknown } | null;
  if (result?.environment !== getPaymentEnvironment()) {
    throw new Error("O pagamento respondeu em um ambiente diferente. Nenhuma cobrança foi iniciada.");
  }
  if (typeof result.url !== "string") {
    throw new Error(typeof result?.error === "string" ? result.error : "Não foi possível iniciar o pagamento agora.");
  }
  const url = new URL(result.url);
  if (url.protocol !== "https:" || !/^www\.mercadopago\.com(?:\.br)?$/i.test(url.hostname)) {
    throw new Error("O provedor retornou um endereço de pagamento inválido.");
  }
  return url.toString();
}
