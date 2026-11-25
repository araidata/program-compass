import { test } from "node:test";
import assert from "node:assert/strict";
import { findNavItem, navigation } from "../../src/lib/navigation";

test("every business workspace is directly reachable and nested routes select the correct destination", () => {
  for (const path of [
    "/capabilities/planning",
    "/workforce/planning",
    "/roadmap/plan",
    "/reports/data",
  ]) {
    assert.ok(navigation.some((item) => item.href === path));
    assert.equal(findNavItem(path)?.href, path);
    assert.equal(findNavItem(`${path}/detail`)?.href, path);
  }
  assert.equal(findNavItem("/capabilities")?.href, "/capabilities");
  assert.equal(findNavItem("/")?.href, "/");
  assert.equal(findNavItem("/roadmapping"), undefined);
});
