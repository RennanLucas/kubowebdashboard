import { test, expect } from "@playwright/test";
const quota = { state:null,request_id:null,used:0,remaining:10,limit:10,configured:true,can_generate:true,
  model:"gemini-3.8-flash",latest:null,resets_at:"2030-02-01T00:00:00Z" };
for (const width of [375,390,430,768,1280]) {
  test(`paid AI panel is readable and only generates on click at ${width}px`,async ({ page },testInfo) => {
    const calls:string[] = []; const errors:string[] = [];
    page.on("pageerror",error => errors.push(error.message));
    await page.route("**/*",route => {
      const url = new URL(route.request().url());
      if (url.pathname==="/src/contexts/AuthContext.tsx") return route.fulfill({ contentType:"application/javascript",
        body:'export const useAuth = () => ({ user:{id:"fixture-user"},session:{access_token:"synthetic-test-token"} });' });
      if (url.pathname==="/src/contexts/OrganizationContext.tsx") return route.fulfill({ contentType:"application/javascript",
        body:'export const useOrganization = () => ({ activeOrganization:{id:"00000000-0000-4000-8000-000000000003"} });' });
      if (url.pathname==="/src/hooks/usePlan.ts") return route.fulfill({ contentType:"application/javascript",
        body:'export const usePlan = () => ({ loading:false,can:() => true });' });
      // Intercept the Edge Function by path so the fixture stays hermetic even
      // when CI injects a real staging Supabase URL.
      if (url.pathname.endsWith("/functions/v1/ai-weekly-insights")) {
        const headers = { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"authorization,apikey,content-type",
          "Access-Control-Allow-Methods":"GET,POST,OPTIONS" };
        if (route.request().method()==="OPTIONS") return route.fulfill({ status:204,headers });
        calls.push(route.request().method());
        const generated = route.request().method()==="POST";
        return route.fulfill({ headers,json:generated ? { ...quota,state:"succeeded",used:1,remaining:9,
          latest:{ id:"fixture-insight",content:"Relatório de teste com dados sintéticos.",created_at:"2030-01-01T00:00:00Z",
            project_id:"00000000-0000-4000-8000-000000000005",period_days:7,model:quota.model } } : quota });
      }
      return ["127.0.0.1", "localhost"].includes(url.hostname) ? route.continue() : route.abort();
    });
    await page.setViewportSize({ width,height:900 });
    await page.emulateMedia({ reducedMotion:"reduce" });
    await page.goto("/e2e/fixtures/ai-panel.html");
    await expect(page.getByText("10 de 10")).toBeVisible();
    expect(calls).toEqual(["GET"]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await expect(page.getByRole("button",{ name:"Gerar com IA" })).toBeEnabled();
    await page.screenshot({ path:testInfo.outputPath(`ai-panel-${width}.png`),fullPage:true });
    await page.getByRole("button",{ name:"Gerar com IA" }).click();
    await expect(page.getByRole("heading",{ name:"Relatório salvo" })).toBeVisible();
    await expect(page.getByText("9 de 10")).toBeVisible();
    expect(calls).toEqual(["GET","POST"]);
    expect(errors).toEqual([]);
  });
}
