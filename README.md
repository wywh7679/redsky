# Redsky Feed Exporter

A Manifest V3 Chrome extension that captures the initial JSON response from Target's Redsky `redsky_aggregations/v1/web/plp_search_v2` feed while you browse a category page. It provides an in-page product preview and downloads the complete response to a category folder such as `mens-shoes/page-001.json`.

## Install

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select this repository directory.
4. Open or refresh a `https://www.target.com/` category page.

## Use

The red **Redsky (n)** button appears at the lower-right of Target pages. Open the panel to preview products from the initial response, then choose **Save unmodified JSON**. Later pagination or infinite-scroll responses are ignored.

The downloaded file is the endpoint response itself: the extension does not add metadata, select fields, reorder arrays, or wrap the response. Nothing is sent anywhere other than Chrome's local download manager.

> Target can change its private response shape or endpoint. The exporter searches common nested product collections and intentionally ignores every Redsky response except HTTPS requests to `/redsky_aggregations/v1/web/plp_search_v2` on `redsky.target.com`. Query parameters can vary by category, page, store, and visitor.

## Test

```sh
node --test
```
