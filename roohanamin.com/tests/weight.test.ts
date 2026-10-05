import { test } from "node:test";
import assert from "node:assert/strict";
import {
  entrySchema,
  toKg,
  fromKg,
  newestFirst,
  localDate,
  formatDate,
  type Entry,
} from "../lib/weight";
const valid = {
  id: "10000000-0000-4000-8000-000000000001",
  weight: "165.25",
  unit: "lb",
  measured_on: "2026-10-05",
  note: "",
};
test("rejects invalid, unsafe and impossible entries", () => {
  assert.equal(entrySchema.safeParse(valid).success, true);
  for (const change of [
    { weight: "" },
    { weight: "NaN" },
    { weight: "-12" },
    { weight: "0" },
    { weight: "9999" },
    { weight: "12.555" },
    { measured_on: "2026-02-30" },
    { measured_on: "2026-13-01" },
    { note: "x".repeat(301) },
    { id: "forged" },
    { unit: "stone" },
  ])
    assert.equal(
      entrySchema.safeParse({ ...valid, ...change }).success,
      false,
      JSON.stringify(change),
    );
  assert.equal(
    entrySchema.safeParse({ ...valid, measured_on: "2024-02-29" }).success,
    true,
  );
});
test("unit conversion preserves measurements when changing the display unit", () => {
  assert.equal(toKg(100, "kg"), 100);
  assert.equal(toKg(165.25, "lb"), 74.956);
  assert.ok(Math.abs(fromKg(toKg(165.25, "lb"), "lb") - 165.25) < 0.002);
});
test("sorts by measurement date, then creation time, then ID descending without mutation", () => {
  const entry = (id: string, date: string, created: string): Entry => ({
    id,
    measured_on: date,
    created_at: created,
    unit: "kg",
    weight_kg: 75,
    note: "",
  });
  const input = [
    entry("1", "2026-01-01", "2026-10-05"),
    entry("2", "2026-10-04", "2026-10-04"),
    entry("3", "2026-10-04", "2026-10-05"),
    entry("4", "2026-10-04", "2026-10-05"),
  ];
  assert.deepEqual(
    newestFirst(input).map((v) => v.id),
    ["4", "3", "2", "1"],
  );
  assert.equal(input[0].id, "1");
});
test("uses local calendar dates and formats stored dates without timezone shifts", () => {
  assert.equal(localDate(new Date(2026, 9, 5, 23, 59)), "2026-10-05");
  assert.equal(formatDate("2026-10-05"), "Oct 5, 2026");
});
