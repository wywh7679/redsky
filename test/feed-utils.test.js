const assert = require("node:assert/strict");
const test = require("node:test");
const utils = require("../lib/feed-utils.js");

test("finds products in a nested Redsky-style payload", () => {
  const products = [{ tcin: "1", title: "One" }, { tcin: "2", title: "Two" }];
  assert.deepEqual(utils.findProductArray({ data: { search: { products } } }), products);
});

test("formats safe category folder names", () => {
  assert.equal(utils.slugify("Women's Shoes & Boots"), "women-s-shoes-boots");
});

test("reads common nested product display fields", () => {
  const product = { item: { tcin: "123", product_description: { title: "Desk" }, enrichment: { images: { primary_image_url: "desk.jpg" } } } };
  assert.equal(utils.productId(product, 0), "123");
  assert.equal(utils.productTitle(product), "Desk");
  assert.equal(utils.productImage(product), "desk.jpg");
});
