import assert from "node:assert/strict";
import test from "node:test";
import { pillars, withScope } from "../../src/lib/pillars";
test("changing pillar preserves existing filters and fragments", () => {
  assert.equal(
    withScope("/capabilities?view=performance&q=test#table", pillars[2]),
    "/capabilities?view=performance&q=test&pillar=grc#table",
  );
  assert.equal(
    withScope("/capabilities?view=gaps&pillar=grc", null),
    "/capabilities?view=gaps",
  );
});
