# Expression Tab — Chrome Web Store Listing

> Last Updated: 2026-09-23
> Branch: 110-cws-readiness-fixes (issue #110)

## Store Listing

**Extension Name** [REQUIRED]
Expression Tab (matches manifest.json "name")

**Short Description** [REQUIRED]
Search your history and bookmarks by host — a clean, fast new tab page for Chrome.

**Detailed Description** [REQUIRED]
Expression Tab replaces the Chrome new tab page with a searchable interface for browsing history and bookmarks, organized by host. It helps you quickly find previously visited pages and manage your bookmarks in one place.

Key features:
- Search across your browsing history and bookmarks from a single search bar.
- Bookmarks are automatically grouped by host for easy navigation.
- Clean, distraction-free design that puts your data front and center.
- Supports custom background images with proper attribution (copyright set via loadBackgroundMeta).

How to use it:
1. Install the extension or load unpacked from builds/expressiontab.
2. Open a new tab — Expression Tab loads automatically.
3. Type in the search bar to find history or bookmarks.
4. Click any host group to see its items, or use the star icon to create a new bookmark.

Privacy note: Expression Tab reads your browsing history and bookmarks locally within your browser. No data is transmitted to external servers without your explicit action. Your data stays on your device.

**Category** [REQUIRED]
Productivity

**Single Purpose** [REQUIRED]
A searchable new tab page that organizes browsing history and bookmarks by host.

**Primary Language** [REQUIRED]
English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Present | src/assets/icon128.png |
| Extension icons | 16 / 32 / 48 / 128 | ✅ Present | src/assets/icon{16,32,48,128}.png |
| Screenshot 1 [REQUIRED] | 1280×800 | ✅ Created | store-assets/screenshot-1-newtab-1280x800.png |
| Screenshot 2 [RECOMMENDED] | 1280×800 | ⬜ Optional follow-up | — |
| Screenshot 3 [RECOMMENDED] | 1280×800 | ⬜ Optional follow-up | — |

> Icons referenced in manifest (`assets/icon*.png`) ship from `src/assets/` into the build. Verified sizes: 16×16, 32×32, 48×48, 128×128.

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `bookmarks` | permissions | Used by extension to read, search, create, remove bookmarks (Anchores.svelte, AnchoreItem.svelte, BubbleField.svelte). |
| `storage` | permissions | Used by chrome.storage.local to persist background URL and metadata (background-persist.ts). |
| `history` | permissions | Used by chrome.history.search to retrieve browsing history for display and search (Anchores.svelte, history-range.ts). |
| `favicon` | permissions | Used to load site icons via Chrome Favicon API (`chrome-extension://ID/_favicon/…` in bookmarks.ts `chromeFaviconUrl`). |
| `<all_urls>` | host_permissions | Required so favicon/cover fetches and history/bookmark URLs across arbitrary hosts work for the dial. |

> Removed unused `sessions` (no `chrome.sessions` calls in source) in #110.

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** Yes — locally only, no external transmission.

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Web history | Yes | No | Display in new tab search | No |
| Bookmarks | Yes | No | Display and manage in new tab | No |
| User activity | Yes | No | UI tracking for display (which items shown/clicked) | No |
| Background image URL | Yes | No | Persist custom background via chrome.storage.local | No |

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL** [REQUIRED]
https://github.com/korzhanov/expressiontab/blob/main/PRIVACY.md

> PRIVACY.md is in the repo. After merge to `main`, the URL above is public and suitable for the CWS privacy policy field.

## Distribution

**Visibility**: Public
**Regions**: All regions

## Developer Info

**Publisher Name** [REQUIRED]
Oleg Korzhanov

**Contact Email** [REQUIRED — must be valid and public]
korzhanov.oleg@gmail.com

**Support URL / Email** [RECOMMENDED]
https://github.com/korzhanov/expressiontab/issues

**Homepage URL** [RECOMMENDED]
https://github.com/korzhanov/expressiontab

## Version History

> Versions aligned: `manifest.json` and `package.json` both `0.1.0`.

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 0.1.0 | 2026-09-23 | CWS readiness (#110): drop unused `sessions`, keep `favicon`, confirm icons, add store screenshot 1280×800, contact email, PRIVACY.md. | Draft |
| 0.1.0 / was 1.0 | 2026-09-23 | Initial release prep: new-tab history/bookmarks search, video preview, background image attribution, README cleanup, CHROMEWEBSTORE.md created. Merged PR #109. | Draft |

## Review Notes

### Known Issues / Limitations

1. ~~**Icon files missing**~~ — ✅ Icons present under `src/assets/` at correct sizes.
2. ~~**Unused permissions**~~ — ✅ Removed `sessions`. Kept `favicon` (used by `_favicon` API).
3. ~~**No screenshots**~~ — ✅ `store-assets/screenshot-1-newtab-1280x800.png` (1280×800). Optional screenshots 2–3 still recommended.
4. ~~**No privacy policy URL**~~ — ✅ PRIVACY.md; live after merge to `main` at the URL above.
5. ~~**No contact email**~~ — ✅ korzhanov.oleg@gmail.com (listing + PRIVACY.md).
6. ~~**Version mismatch**~~ — ✅ Both `0.1.0`.

### Optional before submit
- Add 1–2 more screenshots (list/lined view, search results).
- Upload ZIP of `builds/expressiontab` (exclude `.git/`, `node_modules/`, `.env`, `CHROMEWEBSTORE.md`).

### Rejection History
<!-- If applicable -->
