import { expect, test } from "vitest";

test("adds two numbers", () => {
  expect(2 + 3).toBe(5);
});

test("multiplies two numbers", () => {
  expect(2 * 3).toBe(6);
});

test.skip("divides two numbers", () => {
  expect(6 / 3).toBe(2);
});
