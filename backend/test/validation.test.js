const test = require("node:test");
const assert = require("node:assert/strict");
const { validateRecommendationQuery } = require("../dist/utils/validation.js");
const { TTLCache } = require("../dist/utils/ttlCache.js");

test("normalizes a valid recommendation query", () => {
  assert.deepEqual(validateRecommendationQuery({ query: "  dark   sci-fi  " }), {
    ok: true,
    query: "dark sci-fi",
  });
});

test("rejects missing, short, and oversized recommendation queries", () => {
  assert.equal(validateRecommendationQuery(null).ok, false);
  assert.equal(validateRecommendationQuery({ query: "a" }).ok, false);
  assert.equal(validateRecommendationQuery({ query: "x".repeat(501) }).ok, false);
});

test("TTLCache evicts the least recently used entry at its size limit", () => {
  const cache = new TTLCache(2, 60_000);
  cache.set("first", 1);
  cache.set("second", 2);
  assert.equal(cache.get("first"), 1);
  cache.set("third", 3);
  assert.equal(cache.get("second"), undefined);
  assert.equal(cache.get("first"), 1);
  assert.equal(cache.get("third"), 3);
});
