# Redsky Feed Exporter

A Manifest V3 Chrome extension that captures JSON responses from Target's Redsky feed while you browse category pages. It provides an in-page preview, lets you choose individual products, and downloads each captured feed page to a category folder such as `mens-shoes/page-001.json`.

## Install

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select this repository directory.
4. Open or refresh a `https://www.target.com/` category page.

## Use

The red **Redsky (n)** button appears at the lower-right of Target pages. Browse or scroll until feeds load, open the panel, preview the captured items, and adjust the checkboxes. **Save JSON** creates one file for every captured response that still has selected items. Chrome may ask for permission to download multiple files the first time.

Each file contains the category name, source feed URL, capture timestamp, and the complete original objects for the selected products. Duplicate responses are ignored. Nothing is sent anywhere other than Chrome's local download manager.

> Target can change its private response shape or endpoints. The exporter searches common nested product collections and is intentionally limited to `target.com` and `redsky.target.com`.

## Test

```sh
node --test
```
