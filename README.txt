Nomi GitHub Version 2.2.2
This ZIP contains all files for the GitHub Pages version.

Basis:
- This version continues from the current popup-only line.
- No start screen design changes were made.
- No meditation screen layout changes were made.
- No audio behavior changes were made.

What changed:
- Only the Settings popup overlay and popup card transparency were adjusted.
- The overlay remains black but is more transparent: rgba(0,0,0,.26).
- Blur is fixed at 6px.
- The Settings card is now semi-transparent, so the Nomi start screen remains visible behind it.
- Theme-specific card colors are retained:
  - Ocean: rgba(0,26,34,.78)
  - Twilight: rgba(24,18,42,.78)
  - Forest: rgba(10,34,30,.78)
- The subtle fade/scale animation remains unchanged.

Strict scope:
- Only .modal / .modal-card and versioned file references were changed.
- Start screen, animated graphic, Nomi title, Breathing Meditation text, Start button, Share link, meditation screen, Prepare position, Wake Lock, auto-return and audio remain unchanged.

Important:
This ZIP does not include MP3 files so your existing sounds on GitHub are not overwritten.
Keep these files unchanged:
- einatmen.mp3
- ausatmen.mp3
- ende.mp3

Upload all files from this ZIP into the GitHub repository root and overwrite existing files where GitHub asks.
The new index.html now uses:
- app_v222.js
- style_v222.css
