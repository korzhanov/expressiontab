---
name: Resolve CHROMEWEBSTORE.md issues
overview: "Fix all issues identified in CHROMEWEBSTORE.md: missing icon files, unused permissions, no screenshots, version mismatch, and contact email."
todos:
  - id: icons
    content: "Create missing icon files: assets/icon16.png, assets/icon32.png, assets/icon48.png, assets/icon128.png (PNG, 16x16, 32x32, 48x48, 128x128 pixels)"
    status: completed
  - id: permissions
    content: Remove unused permissions 'sessions' and 'favicon' from src/manifest.json
    status: completed
  - id: screenshots
    content: Add at least one 1280×800 screenshot to CHROMEWEBSTORE.md and note the filename
    status: completed
  - id: version
    content: Update manifest.json version from '1.0' to '0.1.0' to match package.json
    status: completed
  - id: contact
    content: Update contact email in CHROMEWEBSTORE.md from placeholder to valid address
    status: completed
isProject: false
---

First create the four missing icon files (16, 32, 48, 128px). Then remove unused permissions 'sessions' and 'favicon' from manifest.json. Next, add at least one screenshot at 1280×800 in CHROMEWEBSTORE.md. Fix version mismatch by updating manifest.json version from 1.0 to 0.1.0. Finally, update the contact email placeholder to a valid address.