import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const readJson = async (relativePath) => JSON.parse(await readFile(
  path.join(projectRoot, relativePath),
  "utf8"
));

test("includes a traditional summary for each highlighted point", async () => {
  const [catalog, pointData] = await Promise.all([
    readJson("public/data/point-effects.json"),
    readJson("public/data/acu361/points.json")
  ]);
  const pointByMeridianAndName = new Map(pointData.points.map((point) => [
    `${point.meridian}:${point.name_zh}`,
    point
  ]));
  const knownCodes = new Set(pointData.points.map((point) => point.code));

  assert.ok(catalog.sourceNote.length > 0);
  for (const [meridian, names] of Object.entries(catalog.highlights)) {
    for (const name of names) {
      const point = pointByMeridianAndName.get(`${meridian}:${name}`);
      assert.ok(point, `missing highlighted point ${meridian}:${name}`);
      assert.ok(catalog.effects[point.code]?.summary, `missing effect summary for ${point.code}`);
    }
  }

  for (const [code, effect] of Object.entries(catalog.effects)) {
    assert.ok(knownCodes.has(code), `unknown acupoint code ${code}`);
    assert.ok(effect.summary.length > 0, `empty effect summary for ${code}`);
  }
});
