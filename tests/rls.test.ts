import { test, expect } from "bun:test";
import { join } from "node:path";

// Requires PG* env vars (sandbox/CI with database access). Run: bun test tests/rls.test.ts
test("intended RLS policies keep their access behaviour", () => {
  const sql = join(import.meta.dir, "rls", "intended-policies.sql");
  const r = Bun.spawnSync(["psql", "-X", "-q", "-tA", "-f", sql]);
  const out = r.stdout.toString() + r.stderr.toString();
  expect(out).toContain("ALL RLS REGRESSION CHECKS PASSED");
  expect(r.exitCode).toBe(0);
});
