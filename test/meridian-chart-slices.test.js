import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const assetRoot = path.join(projectRoot, "public");
const manifest = JSON.parse(await readFile(
  path.join(assetRoot, "data/meridian-chart/manifest.json"),
  "utf8"
));

test("keeps the original source watermark and page previews", async () => {
  assert.equal(manifest.watermarkPreserved, true);
  for (const page of Object.values(manifest.pages)) {
    await access(path.join(assetRoot, page.image.slice(1)));
  }
});

test("provides an in-bounds image slice for every body region and view", async () => {
  for (const [region, views] of Object.entries(manifest.slices)) {
    for (const [view, slice] of Object.entries(views)) {
      const page = manifest.pages[view];
      const [x, y, width, height] = slice.crop;
      assert.ok(x >= 0 && y >= 0);
      assert.ok(x + width <= page.width && y + height <= page.height, `${view}-${region}`);
      await access(path.join(assetRoot, slice.image.slice(1)));
    }
  }
});

test("includes attributed, licensed supplemental chart images", async () => {
  assert.ok(Object.keys(manifest.supplementalImages).length > 0);
  for (const image of Object.values(manifest.supplementalImages)) {
    assert.equal(image.license, "CC BY 4.0");
    assert.match(image.sourceUrl, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    await access(path.join(assetRoot, image.image.slice(1)));
  }
});

test("provides an attributed, high-resolution real-person point-location photo", () => {
  const photo = manifest.humanPointReference;
  assert.match(photo.image, /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//);
  assert.match(photo.sourceUrl, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  assert.match(photo.originalSourceUrl, /^https:\/\/www\.dvidshub\.net\/image\//);
  assert.match(photo.creator, /U\.S\. Marine Corps/);
  assert.match(photo.license, /Public domain/);
  assert.ok(photo.width >= 5000);
  assert.ok(photo.height >= 3000);
  assert.ok(photo.locatorRegion.leftPercent > 0 && photo.locatorRegion.leftPercent < 100);
  assert.ok(photo.locatorRegion.topPercent > 0 && photo.locatorRegion.topPercent < 100);
});
