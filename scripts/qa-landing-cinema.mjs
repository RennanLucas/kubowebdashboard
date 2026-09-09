import { chromium } from 'playwright';
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const phase = process.argv[2] || 'baseline';
const baseURL = process.env.LANDING_QA_URL || 'http://127.0.0.1:5186';
const output = '../kubo-cinema-evidence';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.route('**/functions/v1/list-plans*', route => route.abort());
await page.goto(baseURL);
await page.locator('.lp-faq__accordion button').first().waitFor({ state: 'attached' });
await page.locator('.lp-price-card').nth(1).waitFor({ state: 'attached' });
await page.locator('.lp-price-card--loading').waitFor({ state: 'detached' });
await page.emulateMedia({ reducedMotion: 'reduce' });
const faq = [];
for (const trigger of await page.locator('.lp-faq__accordion button').all()) {
  await trigger.click();
  faq.push(await page.locator('.lp-faq__accordion [role=region][data-state=open]').innerText());
  await trigger.click();
}
await page.evaluate(() => scrollTo(0, 0));
await page.waitForTimeout(300);
const inventory = await page.locator('.lp-root').evaluate(root => {
  const clean = value => value.replace(/\s+/g, ' ').trim();
  const clone = root.cloneNode(true);
  // The readout changes with the existing story step; compare its source separately.
  clone.querySelector('.lp-story__readout')?.remove();
  return {
    text: clean(clone.textContent),
    headings: [...root.querySelectorAll('h1,h2,h3')].map(el => clean(el.textContent)),
    links: [...root.querySelectorAll('a')].map(el => ({ text: clean(el.textContent), href: el.getAttribute('href') })),
    images: [...root.querySelectorAll('img')].map(el => ({ src: el.getAttribute('src'), alt: el.alt })),
    seo: [...document.head.querySelectorAll('title,meta[name],meta[property],link[rel=canonical]')].map(el => el.outerHTML),
  };
});
// Vite rewrites asset URLs in production. Compare the actual bytes, not build hashes.
for (const image of inventory.images) {
  const response = await fetch(new URL(image.src, baseURL));
  assert(response.ok, `Image failed to load: ${image.src}`);
  image.sha256 = createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');
  delete image.src;
}
inventory.faq = faq;
await writeFile(`${output}/${phase}-content.json`, JSON.stringify(inventory, null, 2));
const bundle = [];
for (const file of await readdir('dist/assets')) {
  if (/^(Landing-|index-).*\.(css|js)$/.test(file)) {
    const data = await readFile(`dist/assets/${file}`);
    bundle.push({ file, bytes: data.length, gzip: gzipSync(data).length });
  }
}
if (phase !== 'baseline') await writeFile(`${output}/${phase}-bundle.json`, JSON.stringify(bundle, null, 2));
if (phase !== 'baseline') {
  const baseline = JSON.parse(await readFile(`${output}/baseline-content.json`, 'utf8'));
  assert.deepEqual(inventory, baseline, 'Content, links, FAQ or SEO changed');
}
const widths = phase === 'baseline' ? [1440] : [375,390,430,768,1024,1280,1440,1920,2560];
const results = [];
await page.emulateMedia({ reducedMotion: 'no-preference' });
for (const width of widths) {
  await page.setViewportSize({ width, height: 1000 });
  await page.evaluate(() => scrollTo(0,0));
  await page.waitForTimeout(2200);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 650) {
    await page.evaluate(y => scrollTo(0,y), y);
    await page.waitForTimeout(55);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}/${y}`);
  }
  if ([390,1440].includes(width)) {
    for (const selector of ['#hero','#product-story','#realtime','#insights','#capabilities','#how-it-works','#pricing','#faq','.lp-final','.lp-footer']) {
      await page.locator(selector).evaluate(el => scrollTo(0,scrollY + el.getBoundingClientRect().top - 90));
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${output}/${phase}-${width}-${selector.replace(/[.#]/g,'')}.png` });
    }
  }
  results.push({ width, overflow: false });
  console.log(`${phase}: ${width}px inspected`);
}
await writeFile(`${output}/${phase}-review.json`, JSON.stringify({ results, errors, contentPreserved: phase !== 'baseline' }, null, 2));
console.log(JSON.stringify({ phase, results, errors, bundle }));
await browser.close();
