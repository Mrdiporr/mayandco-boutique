import { describe, expect, test } from "bun:test";
import { matchesCategory } from "../src/lib/products";

describe("shop category filtering", () => {
  test("omitting a category or selecting all keeps products from every category", () => {
    expect(matchesCategory({ category: "clothing" }, undefined)).toBe(true);
    expect(matchesCategory({ category: "accessories" }, undefined)).toBe(true);
    expect(matchesCategory({ category: "clothing" }, "all")).toBe(true);
    expect(matchesCategory({ category: "accessories" }, "all")).toBe(true);
  });

  test("a selected category still filters out other categories", () => {
    expect(matchesCategory({ category: "clothing" }, "clothing")).toBe(true);
    expect(matchesCategory({ category: "accessories" }, "clothing")).toBe(false);
  });
});