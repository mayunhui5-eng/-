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

test("defines all eight extraordinary vessels with valid Acu361 point references", async () => {
  const [catalog, pointData, routeData] = await Promise.all([
    readJson("public/data/extraordinary-vessels.json"),
    readJson("public/data/acu361/points.json"),
    readJson("public/data/acu361/meridians.json")
  ]);
  const pointIds = new Set(pointData.points.map((point) => point.id));
  const pointCodes = new Set(pointData.points.map((point) => point.code));
  const vessels = catalog.vessels;

  assert.equal(vessels.length, 8);
  assert.equal(new Set(vessels.map((vessel) => vessel.code)).size, 8);
  assert.deepEqual(new Set(vessels.map((vessel) => vessel.name)), new Set([
    "任脉", "督脉", "冲脉", "带脉", "阴跷脉", "阳跷脉", "阴维脉", "阳维脉"
  ]));

  for (const vessel of vessels) {
    for (const code of vessel.points) {
      assert.ok(pointCodes.has(code), `${vessel.name} references missing point ${code}`);
    }

    if (vessel.code === "CV" || vessel.code === "GV") {
      assert.ok(routeData.meridians[vessel.code]?.lines.M.length > 0);
      continue;
    }

    for (const [side, segments] of Object.entries(vessel.paths)) {
      assert.ok(["L", "R", "M"].includes(side));
      for (const segment of segments) {
        assert.ok(segment.length >= 2, `${vessel.name} has a route segment with fewer than two points`);
        for (const id of segment) {
          assert.ok(pointIds.has(id), `${vessel.name} references missing coordinate ${id}`);
        }
      }
    }
  }
});
