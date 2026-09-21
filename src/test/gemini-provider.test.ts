// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { generateGeminiInsight, GEMINI_MODEL, MAX_OUTPUT_TOKENS } from "../../supabase/functions/ai-weekly-insights/_gemini";
const response = (text:string,finish="STOP") => new Response(
  `data: ${JSON.stringify({
    candidates:[{ content:{ parts:[{ text:"private thinking",thought:true },{ text }] } }],
  })}\n\ndata: ${JSON.stringify({
    candidates:[{ finishReason:finish }],
    usageMetadata:{ promptTokenCount:120,candidatesTokenCount:40,totalTokenCount:170 },
  })}\n\n`,
  { headers:{ "Content-Type":"text/event-stream" } },
);
describe("Gemini provider adapter (no external requests)", () => {
  it("bounds tokens, uses only server header credentials and removes thought content", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response("Report"));
    const result = await generateGeminiInsight("server-secret",{ current:{ views:100 } },fetcher);
    expect(result.content).toBe("Report");
    expect(result.model).toBe(GEMINI_MODEL);
    expect(result.usage.total_tokens).toBe(170);
    expect(fetcher.mock.calls[0][0]).not.toContain("server-secret");
    expect(fetcher.mock.calls[0][0]).toContain("streamGenerateContent?alt=sse");
    const options = fetcher.mock.calls[0][1]!;
    expect(options.headers).toMatchObject({ "x-goog-api-key":"server-secret" });
    const body = JSON.parse(options.body as string);
    expect(body.generationConfig.maxOutputTokens).toBe(MAX_OUTPUT_TOKENS);
    expect(body.store).toBe(false);
    expect(body.tools).toBeUndefined();
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });
  it.each(["", " ".repeat(10)])("rejects an empty answer instead of saving a fake report", async text => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(text));
    await expect(generateGeminiInsight("key",{},fetcher)).rejects.toThrow("AI_EMPTY_OUTPUT");
  });
  it.each(["MAX_TOKENS","SAFETY"])("rejects incomplete/blocked answers (%s)", async reason => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response("Partial",reason));
    await expect(generateGeminiInsight("key",{},fetcher)).rejects.toThrow(`AI_FINISH_${reason}`);
  });
  it("does not retry a failed provider request or expose its raw body", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("sensitive provider details",{ status:429 }));
    await expect(generateGeminiInsight("key",{},fetcher)).rejects.toThrow("AI_PROVIDER_HTTP_429");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("distinguishes network failures without exposing their details", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("sensitive network details"));
    await expect(generateGeminiInsight("key",{},fetcher)).rejects.toThrow("AI_PROVIDER_NETWORK");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("rejects a malformed provider stream", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("data: not-json\n\n"));
    await expect(generateGeminiInsight("key",{},fetcher)).rejects.toThrow("AI_INVALID_STREAM");
  });
  it("rejects missing credentials and excessive input before any network request", async () => {
    const fetcher = vi.fn<typeof fetch>();
    await expect(generateGeminiInsight("",{},fetcher)).rejects.toThrow("AI_INVALID_INPUT");
    await expect(generateGeminiInsight("key",{ data:"x".repeat(40001) },fetcher)).rejects.toThrow("AI_INVALID_INPUT");
    expect(fetcher).not.toHaveBeenCalled();
  });
});
