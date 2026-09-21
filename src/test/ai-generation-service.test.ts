// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { runAIGeneration, type AIDependencies, type AIStatus } from "../../supabase/functions/ai-weekly-insights/_service";
const base:AIStatus = { state:null,request_id:null,used:0,remaining:5,limit:5,resets_at:"2030-02-01",
  can_generate:true,started:false,latest:null };
const report = { id:"insight",content:"Report",created_at:"2030-01-01",period_days:7,model:"gemini-3.8-flash",project_id:"project" };
function dependencies(overrides:Partial<AIStatus>={}) {
  const command = vi.fn<AIDependencies["command"]>().mockImplementation(async action => {
    if (action==="reserve") return { ...base,state:"reserved",used:1,remaining:4 };
    if (action==="start") return { ...base,state:"started",started:true,used:1,remaining:4 };
    if (action==="complete") return { ...base,state:"succeeded",used:1,remaining:4,latest:report };
    return { ...base,...overrides };
  });
  return { configured:true,command,summary:vi.fn().mockResolvedValue({ current:{ views:100 },events:[] }),
    consumeProviderBudget:vi.fn().mockResolvedValue(undefined),
    generate:vi.fn().mockResolvedValue({ content:"Report",usage:{ input_tokens:100 } }) };
}
describe("paid generation orchestration", () => {
  it("only reads status when requested; never invokes the provider automatically", async () => {
    const deps = dependencies();
    expect((await runAIGeneration("status",deps)).httpStatus).toBe(200);
    expect(deps.generate).not.toHaveBeenCalled(); expect(deps.summary).not.toHaveBeenCalled();
    expect(deps.command.mock.calls.map(call => call[0])).toEqual(["status"]);
  });
  it.each([
    [{ limit:0 },402], [{ can_generate:false },403], [{ remaining:0 },429],
    [{ state:"started" },409], [{ state:"uncertain" },409], [{ state:"failed" },409],
  ] as [Partial<AIStatus>,number][])("rejects inaccessible or non-retryable generations without cost (%#)", async (status,httpStatus) => {
    const deps = dependencies(status);
    expect((await runAIGeneration("generate",deps)).httpStatus).toBe(httpStatus);
    expect(deps.generate).not.toHaveBeenCalled(); expect(deps.summary).not.toHaveBeenCalled();
  });
  it("does not reserve quota when the provider is not configured or there is no data", async () => {
    const deps = dependencies(); deps.configured=false;
    expect((await runAIGeneration("generate",deps)).httpStatus).toBe(503);
    deps.configured=true; deps.summary.mockResolvedValue({ current:{ views:0 },events:[] });
    expect((await runAIGeneration("generate",deps)).httpStatus).toBe(422);
    expect(deps.command).toHaveBeenCalledTimes(2); expect(deps.generate).not.toHaveBeenCalled();
  });
  it("returns a completed idempotent result without a second provider invocation", async () => {
    const deps = dependencies({ state:"succeeded",latest:report });
    expect((await runAIGeneration("generate",deps)).body).toMatchObject({ latest:report });
    expect(deps.generate).not.toHaveBeenCalled();
  });
  it("does not regenerate a deleted report for an already-spent request", async () => {
    const deps = dependencies({ state:"succeeded",latest:null });
    expect((await runAIGeneration("generate",deps)).httpStatus).toBe(409);
    expect(deps.generate).not.toHaveBeenCalled();
  });
  it("uses reserve → start → provider → complete and never saves directly from the browser", async () => {
    const deps = dependencies();
    const result = await runAIGeneration("generate",deps);
    expect(result.httpStatus).toBe(200);
    expect(deps.command.mock.calls.map(call => call[0])).toEqual(["status","reserve","start","complete"]);
    expect(deps.consumeProviderBudget).toHaveBeenCalledTimes(1);
    expect(deps.generate).toHaveBeenCalledTimes(1);
    expect(deps.command.mock.calls[3]).toEqual(["complete","Report",{ input_tokens:100 }]);
  });
  it("releases an unstarted reservation when the shared free-tier allowance is exhausted", async () => {
    const deps = dependencies();
    deps.consumeProviderBudget.mockRejectedValue(new Error("AI_PROVIDER_DAILY_LIMIT"));
    await expect(runAIGeneration("generate",deps)).rejects.toThrow("AI_PROVIDER_DAILY_LIMIT");
    expect(deps.command.mock.calls.map(call => call[0])).toEqual(["status","reserve","fail"]);
    expect(deps.generate).not.toHaveBeenCalled();
  });
  it("does not call the provider when another request won the start transition", async () => {
    const deps = dependencies();
    deps.command.mockImplementation(async action => ({ ...base,state:action==="status" ? null : "started",started:false }));
    expect((await runAIGeneration("generate",deps)).httpStatus).toBe(409);
    expect(deps.generate).not.toHaveBeenCalled();
  });
  it("marks an uncertain provider call and does not retry it", async () => {
    const deps = dependencies(); deps.generate.mockRejectedValue(new Error("AI_PROVIDER_UNAVAILABLE"));
    await expect(runAIGeneration("generate",deps)).rejects.toThrow("AI_PROVIDER_UNAVAILABLE");
    expect(deps.generate).toHaveBeenCalledTimes(1);
    expect(deps.command.mock.calls.map(call => call[0])).toEqual(["status","reserve","start","fail"]);
  });
  it("keeps a failed completion protected even if ledger finalization is unavailable", async () => {
    const deps = dependencies();
    const original = deps.command.getMockImplementation()!;
    deps.command.mockImplementation(async (...args) => {
      if (["complete","fail"].includes(args[0])) throw new Error("AI_LEDGER_UNAVAILABLE");
      return original(...args);
    });
    const spy = vi.spyOn(console,"error").mockImplementation(() => {});
    try {
      await expect(runAIGeneration("generate",deps)).rejects.toThrow("AI_LEDGER_UNAVAILABLE");
      expect(deps.generate).toHaveBeenCalledTimes(1);
    } finally { spy.mockRestore(); }
  });
});
