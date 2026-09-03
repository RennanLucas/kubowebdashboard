import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const productTourCss = readFileSync(
  resolve(process.cwd(), "src/lib/product-tour.css"),
  "utf8",
);

describe("product tour positioning", () => {
  it("preserva o posicionamento fixo exigido pelo driver.js", () => {
    const popoverRule = productTourCss.match(
      /\.driver-popover\.kubo-product-tour\s*\{([\s\S]*?)\}/,
    );

    expect(popoverRule?.[1]).toMatch(/position:\s*fixed\s*;/);
    expect(popoverRule?.[1]).not.toMatch(/position:\s*relative\s*;/);
  });
});
