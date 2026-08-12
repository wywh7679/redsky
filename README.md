# Redsky Feed Exporter

A Manifest V3 Chrome extension that captures the initial JSON response from Target's Redsky `redsky_aggregations/v1/web/plp_search_v2` feed while you browse a category page. It provides an in-page product preview and downloads the complete response to a category folder such as `mens-shoes/page-001.json`.

## Install

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select this repository directory.
4. Open or refresh a `https://www.target.com/` category page.

## Use

The red **Redsky (n)** button appears at the lower-right of Target pages. Open the panel to preview products from the initial response, then choose **Save JSON**. The extension remembers later pagination or infinite-scroll responses without automatically replacing the preview. Select **Refresh capture** to replace the preview with the most recent `plp_search_v2` XHR or fetch response; if no newer request has occurred, it reloads the current captured response.

The download retains the complete endpoint response, including variation swatch data and `product_description` fields. HTML is removed from string values directly inside `bullet_descriptors` and `soft_bullets`; all other response data is preserved. The filename is calculated from the response's `offset` and `count`, so the second results page is saved as `page-002.json`. Nothing is sent anywhere other than Chrome's local download manager.

> Target can change its private response shape or endpoint. The exporter searches common nested product collections and intentionally ignores every Redsky response except HTTPS requests to `/redsky_aggregations/v1/web/plp_search_v2` on `redsky.target.com`. Query parameters can vary by category, page, store, and visitor.

## Test

```sh
node --test
```
