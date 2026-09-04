import { describe, expect, it, vi } from "vitest";
import {
  isTransientNetworkError,
  toCustomerNetworkMessage,
  withTransientNetworkRetry,
} from "@/lib/network-retry";

describe("network retry", () => {
  it("retries a transient fetch failure and returns the recovered value", async () => {
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValue("ok");

    await expect(withTransientNetworkRetry(operation, { delaysMs: [0] })).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("does not retry application and HTTP errors", async () => {
    const operation = vi.fn<() => Promise<string>>().mockRejectedValue(new Error("Forbidden"));
    await expect(withTransientNetworkRetry(operation, { delaysMs: [0] })).rejects.toThrow("Forbidden");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("recognizes browser transport failures and hides technical wording", () => {
    const error = new TypeError("Failed to fetch");
    expect(isTransientNetworkError(error)).toBe(true);
    expect(toCustomerNetworkMessage(error, "fallback")).toBe(
      "A conexão com o servidor foi interrompida. Tente novamente em alguns instantes.",
    );
  });
});
