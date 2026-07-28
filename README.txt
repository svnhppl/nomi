Nomi GitHub Version 2.0.5

This ZIP is for the GitHub Pages version only.

What changed:
- The Settings popup now has separate desktop/tablet and mobile layouts.
- On mobile, the popup width is strictly limited to the visible viewport.
- Horizontal scrolling in the Settings popup is prevented.
- Theme options stack vertically on mobile.
- Duration options use a 2 x 2 grid on mobile.
- Breathing Rhythm options stay full-width and readable on mobile.
- The Breathing Rhythm choices from v2.0.4 remain unchanged:
  - Balanced: Inhale 4.5 sec · Exhale 4.5 sec
  - Longer Exhale: Inhale 4.5 sec · Exhale 6.5 sec
- iPhone audio handling remains unchanged.
- Fallback tones remain removed.

Important:
This ZIP does not include MP3 files so your existing sounds on GitHub are not overwritten.
Keep these files unchanged:
- einatmen.mp3
- ausatmen.mp3
- ende.mp3

Upload all files from this ZIP into the GitHub repository root and overwrite existing files where GitHub asks.
The new index.html now uses:
- app_v205.js
- style_v205.css
