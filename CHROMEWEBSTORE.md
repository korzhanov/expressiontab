# Expression Tab — Chrome Web Store Listing

> Last Updated: 2026-09-23
> Branch: 112-cws-check-followups (issue #112)

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
- Optional custom or daily wallpaper backgrounds with attribution when available.

How to use it:
1. Install Expression Tab from the Chrome Web Store.
2. Open a new tab — Expression Tab loads automatically.
3. Type in the search bar to find history or bookmarks.
4. Click any host group to see its items, or use the star icon to create a new bookmark.

Privacy note: History and bookmarks stay in your browser. The extension may fetch site icons and (if you use wallpaper features) background images from the web; it does not upload your history or bookmarks to Expression Tab servers. See the privacy policy for details.

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
| CWS ZIP | — | ✅ Script | `bun run package:cws` → store-assets/expressiontab-v*.zip |

> Icons referenced in manifest (`assets/icon*.png`) ship from `src/assets/` into the build. Verified sizes: 16×16, 32×32, 48×48, 128×128. Lato fonts are self-hosted under `src/assets/fonts/`.

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `bookmarks` | permissions | Read, search, create, and remove bookmarks shown on the new tab dial. |
| `storage` | permissions | Persist background URL and related metadata in chrome.storage.local. |
| `history` | permissions | Search browsing history to populate and filter the dial. |
| `favicon` | permissions | Load site icons via Chrome’s Favicon API (`/_favicon/`) for dial tiles. |
| `<all_urls>` | host_permissions | Fetch favicons, cover images, and optional wallpaper images from arbitrary https origins so every host on the dial can show its icon and backgrounds can load. Not used to inject scripts into web pages. |

> Removed unused `sessions` (no `chrome.sessions` calls) in #110. Fonts no longer loaded from Google CDN (#112).

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** Yes — history/bookmarks/settings locally. Limited outbound fetches for icons/wallpapers (no upload of history/bookmark lists to Expression Tab).

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Web history | Yes | No (not uploaded) | Display in new tab search | No |
| Bookmarks | Yes | No (not uploaded) | Display and manage in new tab | No |
| User activity (UI) | Yes | No | Which items shown/clicked in UI | No |
| Background image URL | Yes | Stored locally; image bytes may be fetched from wallpaper hosts | Custom / daily wallpaper | Image hosts see HTTP request only |
| Favicon / cover image requests | Yes (URLs of sites on dial) | Request to site/CDN for the image file | Show icons on dial | Favicon/CDN hosts see HTTP request only |

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL** [REQUIRED]
https://github.com/korzhanov/expressiontab/blob/main/PRIVACY.md

> PRIVACY.md is public on `main` after merge.

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
| 0.1.0 | 2026-09-23 | CWS check follow-ups (#112): accurate privacy, self-hosted Lato, listing copy, `package:cws`, screenshot without preview badge. | Draft |
| 0.1.0 | 2026-09-23 | CWS readiness (#110): drop unused `sessions`, keep `favicon`, icons, screenshot, contact email, PRIVACY.md. Merged #111. | Draft |

## Review Notes

### Known Issues / Limitations

1. ~~**Icon files missing**~~ — ✅ Icons present under `src/assets/`.
2. ~~**Unused permissions**~~ — ✅ Removed `sessions`; kept `favicon`.
3. ~~**No screenshots**~~ — ✅ `store-assets/screenshot-1-newtab-1280x800.png`.
4. ~~**Privacy policy inaccurate / incomplete**~~ — ✅ Rewritten in #112 (local data + icon/wallpaper fetches).
5. ~~**Contact email**~~ — ✅ korzhanov.oleg@gmail.com.
6. ~~**Version mismatch**~~ — ✅ Both `0.1.0`.
7. ~~**Remote Google Fonts**~~ — ✅ Self-hosted Lato woff2 (#112).
8. ~~**Listing implementation details**~~ — ✅ User-facing copy only (#112).
9. ~~**No ZIP packaging script**~~ — ✅ `bun run package:cws` (#112).

### Optional before submit
- Add 1–2 more screenshots (list/lined view, search results).
- Run `bun run package:cws` and upload the zip from `store-assets/`.

### Rejection History
<!-- If applicable -->
