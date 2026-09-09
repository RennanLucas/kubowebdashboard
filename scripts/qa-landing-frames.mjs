import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';

// Local browser sampling, not a field Core Web Vitals or physical-device benchmark.
const browser = await chromium.launch();
const samples = [];
for (const [name, url] of [['before','http://127.0.0.1:5187'],['after','http://127.0.0.1:5186']]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.route('**/functions/v1/list-plans*', route => route.abort());
  await page.goto(url);
  await page.locator('.kubo-board').waitFor({ state: 'visible' });
  await page.waitForTimeout(2500);
  const result = await page.evaluate(async () => {
    const frames = [];
    const start = performance.now();
    let previous = start;
    await new Promise(resolve => {
      const step = time => {
        frames.push(time - previous);
        previous = time;
        scrollTo(0, (time - start) * 2);
        if (time - start < 4000) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
    frames.sort((a,b) => a-b);
    return {
      averageFps: +(1000 / (frames.reduce((a,b)=>a+b,0) / frames.length)).toFixed(1),
      p95FrameMs: +frames[Math.floor(frames.length*.95)].toFixed(1),
      framesAbove50ms: frames.filter(value=>value>50).length,
      samples: frames.length,
    };
  });
  samples.push({ name, ...result });
  await page.close();
}
await browser.close();
await writeFile('../kubo-cinema-evidence/frames.json', JSON.stringify(samples,null,2));
console.log(JSON.stringify(samples));
