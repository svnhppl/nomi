Nomi GitHub Version 2.1.6

This ZIP contains all files for the GitHub Pages version.

Basis:
- This version is based on the last stable working version 2.1.4.
- No start screen design changes were made.
- No settings panel redesign was added.

What changed:
- A screen wake lock is requested when the meditation starts.
- The screen wake lock is released when the meditation ends or when the session is manually ended.
- If the browser or device does not support screen wake lock, Nomi continues normally without showing an error.
- Existing pause/resume sound handling, start screen, progress bar, themes and animation styles remain unchanged.

Important:
This ZIP does not include MP3 files so your existing sounds on GitHub are not overwritten.
Keep these files unchanged:
- einatmen.mp3
- ausatmen.mp3
- ende.mp3

Upload all files from this ZIP into the GitHub repository root and overwrite existing files where GitHub asks.
The new index.html now uses:
- app_v216.js
- style_v216.css
