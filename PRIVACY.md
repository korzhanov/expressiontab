# Expression Tab Privacy Policy

Last Updated: 2026-09-23

## Overview

Expression Tab is a Chrome extension that replaces the new tab page with a searchable view of your browsing history and bookmarks, grouped by host. This policy explains what data is used and what leaves your device.

## Data kept on your device

- **Browsing history** — read locally via Chrome APIs to show and search recent pages.
- **Bookmarks** — read and updated locally so you can browse and manage bookmarks in the new tab.
- **Settings and background metadata** — stored in `chrome.storage.local` (for example custom background URL and attribution).
- No names, emails, or account credentials are collected by the extension.
- History and bookmarks are **not** uploaded to servers operated by Expression Tab.

## Network requests (no personal profile upload)

The extension may request resources from the open web so the dial and wallpaper work. These requests do **not** send your browsing history or bookmark lists to Expression Tab servers (there are none). Typical outbound fetches:

- **Site icons / covers** — from the site origin, Chrome’s Favicon API, or a public favicon helper (for example Google’s favicon service) so tiles show the correct icon.
- **Optional wallpapers** — only when you use wallpaper features: image feeds such as Bing, Peapix, or Picsum, as implemented in the extension.
- Fonts ship **inside** the extension package (no Google Fonts CDN).

Third parties that host those images or icons may see a standard HTTP request (IP, User-Agent, requested URL). Expression Tab does not sell data, run ads, or build credit/lending profiles.

## Data use

- Data is used only to run the new tab UI (search, display, organization, wallpaper).
- No telemetry or analytics SDK is bundled.
- No data is sold to third parties.

## User control

- Clear history or bookmarks with Chrome’s own tools at any time.
- Disable or uninstall the extension at any time.
- Change or clear a custom background from the extension UI / local storage.

## Contact

For privacy concerns, contact: korzhanov.oleg@gmail.com
