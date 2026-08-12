const assert = require("node:assert/strict");
const test = require("node:test");
const utils = require("../lib/feed-utils.js");
const { isPlpSearchUrl } = require("../lib/url-utils.js");

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

test("accepts only the Redsky PLP search endpoint", () => {
  assert.equal(isPlpSearchUrl("https://redsky.target.com/redsky_aggregations/v1/web/plp_search_v2?category=55mcz&offset=0"), true);
  assert.equal(isPlpSearchUrl("https://redsky.target.com/redsky_aggregations/v1/web/plp_search_v2?category=5xtg6&offset=24"), true);
  assert.equal(isPlpSearchUrl("https://redsky.target.com/redsky_aggregations/v1/web/plp_search_v1?category=55mcz"), false);
  assert.equal(isPlpSearchUrl("https://redsky.target.com/redsky_aggregations/v1/web/search_suggestions?query=shoes"), false);
  assert.equal(isPlpSearchUrl("https://example.com/redsky_aggregations/v1/web/plp_search_v2"), false);
  assert.equal(isPlpSearchUrl("not a URL"), false);
});

test("cleans product bullets without removing variation swatches", () => {
  const payload = { product: { variation: { swatches: [{ color: "Navy" }] }, product_description: {
    bullet_descriptors: ["<b>Soft</b> &amp; warm"], soft_bullets: { value: "<p>Machine washable</p>" }
  } } };
  const cleaned = utils.cleanProductBullets(payload);
  assert.deepEqual(cleaned.product.variation.swatches, [{ color: "Navy" }]);
  assert.deepEqual(cleaned.product.product_description.bullet_descriptors, ["Soft & warm"]);
  assert.equal(cleaned.product.product_description.soft_bullets.value, "Machine washable");
  assert.notEqual(cleaned, payload);
});

test("derives the page number from PLP count and offset", () => {
  assert.equal(utils.pageNumberFromUrl("https://redsky.target.com/redsky_aggregations/v1/web/plp_search_v2?count=24&offset=0"), 1);
  assert.equal(utils.pageNumberFromUrl("https://redsky.target.com/redsky_aggregations/v1/web/plp_search_v2?count=24&offset=24"), 2);
  assert.equal(utils.pageNumberFromUrl("https://redsky.target.com/redsky_aggregations/v1/web/plp_search_v2?count=24&offset=216"), 10);
});
