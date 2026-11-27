import test from "node:test";
import assert from "node:assert/strict";
import { getSexagenaryDay, getXuShiOpeningStatus } from "../src/ziwu-liuzhu.js";

test("calculates sexagenary day from the local civil date", () => {
  assert.deepEqual(getSexagenaryDay(new Date(2000, 0, 7)), { stem: "甲", branch: "子" });
  assert.deepEqual(getSexagenaryDay(new Date(2026, 10, 27)), { stem: "乙", branch: "巳" });
});

test("returns the Xu Shi opening point during its listed two-hour period", () => {
  const status = getXuShiOpeningStatus(new Date(2026, 10, 27, 5, 30));
  assert.equal(status.hourBranch, "卯");
  assert.equal(status.current.timePillar, "辛卯");
  assert.deepEqual(status.current.points, [{ channelCode: "LU", pointName: "经渠" }]);
});

test("does not invent an open point between listed periods", () => {
  const status = getXuShiOpeningStatus(new Date(2026, 10, 27, 7, 6));
  assert.equal(status.day.stem, "乙");
  assert.equal(status.hourBranch, "辰");
  assert.equal(status.current, null);
  assert.equal(status.previous.timePillar, "辛卯");
  assert.equal(status.next.timePillar, "癸巳");
  assert.deepEqual(status.previous.points, [{ channelCode: "LU", pointName: "经渠" }]);
  assert.deepEqual(status.next.points, [{ channelCode: "KI", pointName: "阴谷" }]);
});
